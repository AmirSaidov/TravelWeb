import Link from "next/link";

const Privacy = () => {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Privacy Policy</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        This is a demo privacy policy page. Update this text before production (data collection, cookies, analytics, user accounts).
      </p>
      <div className="mt-6">
        <Link href="/" className="text-sm font-medium text-brand hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default Privacy;
