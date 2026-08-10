/**
 * The canonical, user-facing origin for this deployment — `https://subtrace.app`
 * in production, `http://localhost:3000` in dev.
 *
 * Anything needing an absolute URL should resolve it here rather than from the
 * incoming request's `Host` header. Two reasons:
 *
 *  - OAuth redirect URIs must match what is registered in Google Cloud Console
 *    byte for byte. Deriving them from the request means the URI changes
 *    depending on which hostname the user happened to land on (the custom
 *    domain, the `*.vercel.app` domain, a preview URL), and any host that isn't
 *    registered fails the token exchange.
 *  - Links in outbound email and cron jobs have no request to derive an origin
 *    from at all.
 *
 * `BETTER_AUTH_URL` is the single knob: set it to `https://subtrace.app` in
 * Vercel and every consumer follows. The Vercel fallbacks only apply when it is
 * unset, so preview deployments still resolve to their own generated URL.
 */
export function getAppUrl(): string {
  const url =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL)

  // A trailing slash would build `https://subtrace.app//api/gmail/callback`,
  // which Google treats as a different redirect URI than the registered one.
  return (url ?? 'http://localhost:3000').replace(/\/+$/, '')
}
