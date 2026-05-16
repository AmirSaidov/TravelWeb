import Link from "next/link";

const Terms = () => {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Terms of Service</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        This is a demo terms page. Add your booking/payment/refund rules, liability, and local tour operator requirements before production.
      </p>
      <div className="mt-6">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default Terms;
