// ─── COACH SUBSCRIPTION TIERS ─────────────────────────────

export type CoachTier = 'free' | 'pro' | 'elite'

export interface CoachPlan {
  tier: CoachTier
  label: string
  price: number
  priceId: string
  features: string[]
  description: string
}

export const COACH_PLANS: Record<CoachTier, CoachPlan> = {
  free: {
    tier: 'free',
    label: 'Free',
    price: 0,
    priceId: '',
    features: [
      'Basic dashboard & bookings',
      'Up to 5 athletes in roster',
      'AI Coaching Assistant (3 messages/day)',
      'Standard availability editor',
      'Dispute filing',
    ],
    description: 'Get started with basic coaching tools',
  },
  pro: {
    tier: 'pro',
    label: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly',
    features: [
      'Everything in Free',
      'Unlimited athlete roster',
      'Unlimited AI Coaching Assistant',
      'Session notes per athlete',
      'Direct messaging with athletes',
      'Revenue dashboard + CSV export',
      'QR code profile card',
      'Online coaching tools (link sharing)',
    ],
    description: 'For coaches building their business',
  },
  elite: {
    tier: 'elite',
    label: 'Elite',
    price: 59,
    priceId: 'price_elite_monthly',
    features: [
      'Everything in Pro',
      'Advanced analytics & insights',
      'AI-generated progress reports',
      'Video review & feedback',
      'Priority listing in coach discovery',
      'Custom branded report sharing',
      'Auto-reminders for athletes',
      'Early access to new features',
    ],
    description: 'For coaches who want the full suite',
  },
}

// ─── TIER GATING ──────────────────────────────────────────

/** Features that require at least Pro tier */
const PRO_FEATURES = new Set([
  'roster_unlimited',
  'ai_unlimited',
  'session_notes',
  'messaging',
  'revenue_dashboard',
  'csv_export',
  'qrcode',
  'online_coaching',
])

/** Features that require Elite tier */
const ELITE_FEATURES = new Set([
  'analytics',
  'progress_reports',
  'video_review',
  'priority_listing',
  'branded_reports',
  'auto_reminders',
])

export type FeatureKey =
  | 'roster_unlimited' | 'ai_unlimited' | 'session_notes' | 'messaging'
  | 'revenue_dashboard' | 'csv_export' | 'qrcode' | 'online_coaching'
  | 'analytics' | 'progress_reports' | 'video_review' | 'priority_listing'
  | 'branded_reports' | 'auto_reminders'

export function hasAccess(tier: CoachTier, feature: FeatureKey): boolean {
  if (ELITE_FEATURES.has(feature)) return tier === 'elite'
  if (PRO_FEATURES.has(feature)) return tier === 'pro' || tier === 'elite'
  return true // free features
}

export function requiredTier(feature: FeatureKey): CoachTier {
  if (ELITE_FEATURES.has(feature)) return 'elite'
  if (PRO_FEATURES.has(feature)) return 'pro'
  return 'free'
}

export function isUpgrade(current: CoachTier, feature: FeatureKey): boolean {
  const required = requiredTier(feature)
  const tierOrder: CoachTier[] = ['free', 'pro', 'elite']
  return tierOrder.indexOf(current) < tierOrder.indexOf(required)
}