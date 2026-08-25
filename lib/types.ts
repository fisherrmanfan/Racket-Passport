export type Sport = 'tennis' | 'badminton' | 'squash'

export type StringFamily = 'poly' | 'multi' | 'gut' | 'synthetic' | 'badminton'

/** Canonical tension unit is lb. Never round-trip through the display unit. */
export type Unit = 'lb' | 'kg'

export type MeterState = 'fresh' | 'fading' | 'dead' | 'snapped'

export type JobStatus = 'queue' | 'ready' | 'collected'

export type Feedback = 'spot-on' | 'too-tight' | 'too-loose' | 'broke-early'

export interface StringPattern {
  mains: number
  crosses: number
}

export interface RacketModel {
  id: string
  /** `racket_catalog.racket_id` when this model came from the shared catalogue. */
  catalogId?: number
  brand: string
  model: string
  sport: Sport
  headSizeSqIn: number
  pattern: StringPattern
  /**
   * False when the catalogue had no usable pattern and we fell back to 16x19.
   * The string bed meter still draws; the UI just doesn't claim it's exact.
   */
  patternKnown?: boolean
  /** Frame stiffness. Firm frames pull tension recommendations down. */
  ra: number
  /** Manufacturer min tension in lb — the low half of the advisory guardrail. */
  tensionMinLb?: number
  /** Manufacturer max tension in lb — drives the advisory guardrail. */
  maxTensionLb?: number
  weightG?: number
  swingweight?: number
  balancePts?: number
  /** "HL" head-light, "HH" head-heavy, "EB" even balance. */
  balanceType?: string
  /** Product photo from the catalogue's Supabase Storage bucket. */
  imageUrl?: string
}

export interface StringModel {
  id: string
  brand: string
  name: string
  family: StringFamily
  gaugesMm: number[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  /** Play volume, used for the wear projection. */
  hoursPerWeek: number
  remindersPaused?: boolean
}

export interface RacketInstance {
  id: string
  shortCode: string
  customerId: string
  modelId: string
  nickname?: string
}

export interface Job {
  id: string
  racketId: string
  customerId: string
  status: JobStatus
  mainsStringId: string
  crossesStringId: string
  gaugeMm: number
  /** Always lb. */
  tensionMainsLb: number
  tensionCrossesLb: number
  prestretch?: boolean
  twoPiece?: boolean
  priceCents: number
  /** ISO strings. */
  strungAt?: string
  dueAt?: string
  promisedAt?: string
  notifiedAt?: string
  feedback?: Feedback
  snapped?: boolean
}

export interface Reel {
  id: string
  stringId: string
  gaugeMm: number
  metresLeft: number
}
