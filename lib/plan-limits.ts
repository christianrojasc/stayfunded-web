/**
 * Plan limits & feature gating — single source of truth.
 *
 * Free: basic dashboard, 3 accounts, trade logging, journal, checklist, session clock
 * Pro:  everything + unlimited accounts, AI insights, analytics, charts, calendar, progress, reports
 */

export const FREE_ACCOUNT_LIMIT = 3

export type ProFeature =
  | 'insights'
  | 'analytics'
  | 'calendar'
  | 'progress'
  | 'dashboard_charts'      // cum P&L, daily P&L, drawdown, growth curve
  | 'reports'               // PDF/CSV export
  | 'unlimited_accounts'

/** Quick check — is this feature locked for free users? */
export function isProFeature(feature: ProFeature): boolean {
  return true // all ProFeatures are pro-only by definition
}

/** Human-friendly labels for gated features */
export const PRO_FEATURE_LABELS: Record<ProFeature, string> = {
  insights: 'AI Trade Insights',
  analytics: 'Advanced Analytics',
  calendar: 'Trading Calendar',
  progress: 'Progress Tracker',
  dashboard_charts: 'Performance Charts',
  reports: 'PDF & CSV Reports',
  unlimited_accounts: 'Unlimited Accounts',
}
