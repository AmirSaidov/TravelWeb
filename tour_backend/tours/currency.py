from __future__ import annotations

import json
import os
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Dict, Optional


def normalize_currency(raw: Optional[str]) -> str:
    c = (raw or "").strip()
    if not c:
        return ""
    up = c.upper()
    if up in {"KGZ", "KGS"}:
        return "KGS"
    if c in {"сом", "СОМ", "Som", "som"}:
        return "KGS"
    return up


def _parse_decimal(raw: object) -> Optional[Decimal]:
    if raw is None:
        return None
    if isinstance(raw, Decimal):
        return raw
    try:
        return Decimal(str(raw).strip())
    except (InvalidOperation, ValueError):
        return None


def _parse_rates_env(raw: str) -> Dict[str, Decimal]:
    """
    Supported formats:
      - JSON: {"USD": 89.5, "EUR": 97.2}
      - CSV-ish: USD=89.5,EUR=97.2,RUB=1.02
      - Also accepts ":" as separator: USD:89.5
    Values are "base currency units per 1 unit of currency".
    Example when base is KGS: USD=89.5 means 1 USD = 89.5 KGS.
    """
    s = (raw or "").strip()
    if not s:
        return {}

    if s.startswith("{"):
        try:
            data = json.loads(s)
        except json.JSONDecodeError:
            data = {}
        out: Dict[str, Decimal] = {}
        if isinstance(data, dict):
            for k, v in data.items():
                code = normalize_currency(str(k))
                dec = _parse_decimal(v)
                if code and dec and dec > 0:
                    out[code] = dec
        return out

    out: Dict[str, Decimal] = {}
    parts = [p.strip() for p in s.split(",") if p.strip()]
    for part in parts:
        if "=" in part:
            k, v = part.split("=", 1)
        elif ":" in part:
            k, v = part.split(":", 1)
        else:
            continue
        code = normalize_currency(k)
        dec = _parse_decimal(v)
        if code and dec and dec > 0:
            out[code] = dec
    return out


@dataclass(frozen=True)
class CurrencyConfig:
    base: str
    rates_to_base: Dict[str, Decimal]

    def rate_to_base(self, currency: str) -> Optional[Decimal]:
        cur = normalize_currency(currency)
        if not cur:
            return None
        if cur == self.base:
            return Decimal("1")
        return self.rates_to_base.get(cur)


def get_currency_config() -> CurrencyConfig:
    base = normalize_currency(os.getenv("CURRENCY_BASE", "KGS")) or "KGS"
    rates = _parse_rates_env(os.getenv("CURRENCY_RATES", ""))
    # Ensure base is always present
    rates[base] = Decimal("1")
    return CurrencyConfig(base=base, rates_to_base=rates)


def convert_money(amount: Decimal, from_currency: str, to_currency: str) -> Decimal:
    cfg = get_currency_config()
    src = normalize_currency(from_currency) or cfg.base
    dst = normalize_currency(to_currency) or cfg.base

    src_rate = cfg.rate_to_base(src)
    dst_rate = cfg.rate_to_base(dst)
    if src_rate is None or dst_rate is None:
        # Unknown currencies: return original amount unchanged.
        return amount

    amount_base = (amount * src_rate)
    amount_dst = (amount_base / dst_rate)
    return amount_dst


def quantize_money(amount: Decimal) -> Decimal:
    # Keep 2 decimals everywhere; UI can hide trailing zeros.
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

