import Link from "next/link";

export default function GithubErrorPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold">GitHub sign-in could not be completed</h1>
        <p className="mt-2 text-sm text-muted">
          The authorization could not be completed. Please retry the sign-in flow. If the problem persists, confirm that a GitHub OAuth app is configured with the callback URL for this deployment.
        </p>
        <Link href="/auth/signin" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
