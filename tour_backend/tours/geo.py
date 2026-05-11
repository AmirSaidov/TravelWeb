from __future__ import annotations

import os
from typing import Any, Dict, List

import requests
from django.http import JsonResponse
from django.views.decorators.http import require_GET


KG_VIEWBOX = "69.23,43.27,80.28,39.17"  # left,top,right,bottom (lon,lat,lon,lat)
KG_BBOX = "69.23,39.17,80.28,43.27"  # west,south,east,north (lon,lat,lon,lat)
KG_PROXIMITY = "74.6,41.2"


def _addr_subtitle(addr: Dict[str, Any]) -> str:
    parts = [
        addr.get("state"),
        addr.get("county"),
        addr.get("city") or addr.get("town") or addr.get("village"),
        addr.get("road"),
    ]
    return ", ".join([p for p in parts if p])


@require_GET
def suggest_places(request):
    q = (request.GET.get("q") or "").strip()
    if len(q) < 2:
        return JsonResponse([], safe=False)

    mapbox_token = (os.getenv("MAPBOX_TOKEN") or "").strip()
    if mapbox_token:
        try:
            url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{requests.utils.quote(q)}.json"
            resp = requests.get(
                url,
                params={
                    "access_token": mapbox_token,
                    "limit": "6",
                    "autocomplete": "true",
                    "fuzzyMatch": "true",
                    "language": "ru,en",
                    "bbox": KG_BBOX,
                    "proximity": KG_PROXIMITY,
                    "country": "kg",
                },
                timeout=5,
                headers={"User-Agent": "TravelWeb/1.0 (Django admin coordinate picker)"},
            )
            if resp.status_code == 200:
                data = resp.json() if isinstance(resp.headers.get("content-type", ""), str) else resp.json()
                features = data.get("features") if isinstance(data, dict) else None
                if isinstance(features, list):
                    out: List[Dict[str, Any]] = []
                    for f in features:
                        c = f.get("center") if isinstance(f, dict) else None
                        if not (isinstance(c, list) and len(c) >= 2):
                            continue
                        lng, lat = c[0], c[1]
                        if not isinstance(lng, (int, float)) or not isinstance(lat, (int, float)):
                            continue
                        title = str(f.get("text") or f.get("place_name") or "").strip()
                        if not title:
                            continue
                        subtitle = str(f.get("place_name") or "").strip()
                        out.append({"lat": lat, "lng": lng, "name": title, "sub": subtitle})
                    return JsonResponse(out, safe=False)
        except requests.RequestException:
            pass
        except Exception:  # noqa: BLE001
            pass

    params = {
        "format": "jsonv2",
        "limit": "6",
        "addressdetails": "1",
        "countrycodes": "kg",
        "viewbox": KG_VIEWBOX,
        # Prefer KG bbox, but don't hard-bound: some POIs fall outside strict bbox.
        "bounded": "0",
        "q": q,
    }

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params=params,
            timeout=5,
            headers={
                # Nominatim asks for an identifying UA; keep it simple for dev.
                "User-Agent": "TravelWeb/1.0 (Django admin coordinate picker)",
                "Accept-Language": "ru,en",
            },
        )
    except requests.RequestException:
        return JsonResponse([], safe=False)

    if resp.status_code != 200:
        return JsonResponse([], safe=False)

    try:
        data = resp.json()
    except Exception:  # noqa: BLE001
        return JsonResponse([], safe=False)

    if not isinstance(data, list):
        return JsonResponse([], safe=False)

    out: List[Dict[str, Any]] = []
    for r in data:
        try:
            lat = float(r.get("lat"))
            lng = float(r.get("lon"))
        except Exception:  # noqa: BLE001
            continue
        name = (r.get("display_name") or r.get("name") or "").strip()
        if not name:
            continue
        sub = _addr_subtitle(r.get("address") or {})
        out.append({"lat": lat, "lng": lng, "name": name, "sub": sub})

    return JsonResponse(out, safe=False)
