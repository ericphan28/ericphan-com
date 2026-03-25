import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-8xl font-bold gradient-text">404</h1>
        <p className="mt-4 text-xl text-muted">Page not found</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dark transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
