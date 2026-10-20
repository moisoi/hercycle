// Splash timing. The first load and every page change show the splash for at least this long.
export const SPLASH_MIN_MS = 600
export const ROUTE_SPLASH_MS = 600

/** Resolves after `ms`, or immediately if `ms` has already passed since `startedAt`. */
export const waitForMinimum = (startedAt, ms = SPLASH_MIN_MS) =>
  new Promise((resolve) => {
    const remaining = Math.max(0, ms - (Date.now() - startedAt))
    window.setTimeout(resolve, remaining)
  })
