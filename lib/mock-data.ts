import type {
  Customer,
  Job,
  RacketInstance,
  RacketModel,
  Reel,
  StringModel,
} from './types'

/**
 * Fixtures are relative to "now" so the queue always reads sensibly.
 *
 * Tensions are stored in lb, always — the kg toggle is display-only
 * (FRONTEND doc §12). A 53/48.5lb job reads as 24/22 in kg.
 */
const now = Date.now()
const hours = (h: number) => new Date(now + h * 3_600_000).toISOString()
const days = (d: number) => new Date(now + d * 86_400_000).toISOString()

export const racketModels: RacketModel[] = [
  {
    id: 'rm-pa98',
    brand: 'Babolat',
    model: 'Pure Aero 98',
    sport: 'tennis',
    headSizeSqIn: 98,
    pattern: { mains: 16, crosses: 19 },
    ra: 67,
    tensionMinLb: 50,
    maxTensionLb: 62,
  },
  {
    id: 'rm-ez100',
    brand: 'Yonex',
    model: 'Ezone 100',
    sport: 'tennis',
    headSizeSqIn: 100,
    pattern: { mains: 16, crosses: 19 },
    ra: 65,
    tensionMinLb: 45,
    maxTensionLb: 60,
  },
  {
    id: 'rm-blade98',
    brand: 'Wilson',
    model: 'Blade 98 v9',
    sport: 'tennis',
    headSizeSqIn: 98,
    pattern: { mains: 18, crosses: 20 },
    ra: 62,
    tensionMinLb: 50,
    maxTensionLb: 60,
  },
  {
    id: 'rm-astrox',
    brand: 'Yonex',
    model: 'Astrox 99 Pro',
    sport: 'badminton',
    headSizeSqIn: 0,
    pattern: { mains: 22, crosses: 23 },
    ra: 0,
    tensionMinLb: 20,
    maxTensionLb: 24,
  },
]

export const strings: StringModel[] = [
  {
    id: 'st-rpm',
    brand: 'Babolat',
    name: 'RPM Blast',
    family: 'poly',
    gaugesMm: [1.2, 1.25, 1.3],
  },
  {
    id: 'st-alu',
    brand: 'Luxilon',
    name: 'ALU Power',
    family: 'poly',
    gaugesMm: [1.25, 1.3],
  },
  {
    id: 'st-nxt',
    brand: 'Wilson',
    name: 'NXT Comfort',
    family: 'multi',
    gaugesMm: [1.25, 1.3],
  },
  {
    id: 'st-vs',
    brand: 'Babolat',
    name: 'VS Touch Gut',
    family: 'gut',
    gaugesMm: [1.25, 1.3],
  },
  {
    id: 'st-bg65',
    brand: 'Yonex',
    name: 'BG65 Ti',
    family: 'badminton',
    gaugesMm: [0.7],
  },
]

export const customers: Customer[] = [
  { id: 'c-alex', name: 'Alex Tan', phone: '+65 9123 4471', hoursPerWeek: 4 },
  { id: 'c-wei', name: 'Wei Ming', phone: '+65 9887 2210', hoursPerWeek: 6 },
  { id: 'c-sarah', name: 'Sarah Lim', phone: '+65 9455 1180', hoursPerWeek: 3 },
  {
    id: 'c-dan',
    name: 'Daniel Foo',
    phone: '+65 9701 3355',
    hoursPerWeek: 2,
    remindersPaused: true,
  },
  { id: 'c-priya', name: 'Priya Raman', phone: '+65 9330 9042', hoursPerWeek: 5 },
]

export const rackets: RacketInstance[] = [
  { id: 'r-1', shortCode: 'K4T9Q2', customerId: 'c-alex', modelId: 'rm-pa98' },
  {
    id: 'r-2',
    shortCode: 'M8XB1Z',
    customerId: 'c-alex',
    modelId: 'rm-blade98',
    nickname: 'spare',
  },
  { id: 'r-3', shortCode: 'P2WD6L', customerId: 'c-wei', modelId: 'rm-ez100' },
  { id: 'r-4', shortCode: 'T7RN4V', customerId: 'c-sarah', modelId: 'rm-blade98' },
  { id: 'r-5', shortCode: 'B3JH8C', customerId: 'c-dan', modelId: 'rm-astrox' },
  { id: 'r-6', shortCode: 'F9QK2S', customerId: 'c-priya', modelId: 'rm-pa98' },
]

export const jobs: Job[] = [
  // In the queue, promised today
  {
    id: 'j-101',
    racketId: 'r-1',
    customerId: 'c-alex',
    status: 'queue',
    mainsStringId: 'st-rpm',
    crossesStringId: 'st-rpm',
    gaugeMm: 1.25,
    tensionMainsLb: 53,
    tensionCrossesLb: 48.5,
    priceCents: 3500,
    promisedAt: hours(2),
  },
  {
    id: 'j-102',
    racketId: 'r-3',
    customerId: 'c-wei',
    status: 'queue',
    mainsStringId: 'st-alu',
    crossesStringId: 'st-nxt',
    gaugeMm: 1.25,
    tensionMainsLb: 50.5,
    tensionCrossesLb: 46.5,
    twoPiece: true,
    priceCents: 4200,
    promisedAt: hours(5),
  },
  {
    id: 'j-103',
    racketId: 'r-5',
    customerId: 'c-dan',
    status: 'queue',
    mainsStringId: 'st-bg65',
    crossesStringId: 'st-bg65',
    gaugeMm: 0.7,
    tensionMainsLb: 26,
    tensionCrossesLb: 28,
    priceCents: 2200,
    promisedAt: hours(26),
  },
  // Ready for pickup
  {
    id: 'j-104',
    racketId: 'r-4',
    customerId: 'c-sarah',
    status: 'ready',
    mainsStringId: 'st-nxt',
    crossesStringId: 'st-nxt',
    gaugeMm: 1.3,
    tensionMainsLb: 52,
    tensionCrossesLb: 50,
    priceCents: 3800,
    strungAt: days(-1),
    dueAt: days(41),
    notifiedAt: days(-1),
  },
  {
    id: 'j-105',
    racketId: 'r-6',
    customerId: 'c-priya',
    status: 'ready',
    mainsStringId: 'st-rpm',
    crossesStringId: 'st-vs',
    gaugeMm: 1.25,
    tensionMainsLb: 55,
    tensionCrossesLb: 50.5,
    priceCents: 5500,
    strungAt: hours(-6),
    dueAt: days(38),
  },
  // History — these drive SAME AGAIN and the due-this-week count
  {
    id: 'j-090',
    racketId: 'r-1',
    customerId: 'c-alex',
    status: 'collected',
    mainsStringId: 'st-rpm',
    crossesStringId: 'st-rpm',
    gaugeMm: 1.25,
    tensionMainsLb: 53,
    tensionCrossesLb: 48.5,
    priceCents: 3500,
    strungAt: days(-38),
    dueAt: days(2),
    feedback: 'spot-on',
  },
  {
    id: 'j-091',
    racketId: 'r-2',
    customerId: 'c-alex',
    status: 'collected',
    mainsStringId: 'st-alu',
    crossesStringId: 'st-alu',
    gaugeMm: 1.3,
    tensionMainsLb: 50.5,
    tensionCrossesLb: 48.5,
    priceCents: 4000,
    strungAt: days(-96),
    dueAt: days(-12),
    snapped: true,
  },
  {
    id: 'j-092',
    racketId: 'r-3',
    customerId: 'c-wei',
    status: 'collected',
    mainsStringId: 'st-alu',
    crossesStringId: 'st-nxt',
    gaugeMm: 1.25,
    tensionMainsLb: 50.5,
    tensionCrossesLb: 46.5,
    twoPiece: true,
    priceCents: 4200,
    strungAt: days(-30),
    dueAt: days(3),
    feedback: 'too-tight',
  },
  {
    id: 'j-093',
    racketId: 'r-4',
    customerId: 'c-sarah',
    status: 'collected',
    mainsStringId: 'st-nxt',
    crossesStringId: 'st-nxt',
    gaugeMm: 1.3,
    tensionMainsLb: 52,
    tensionCrossesLb: 50,
    priceCents: 3800,
    strungAt: days(-52),
    dueAt: days(4),
  },
  {
    id: 'j-094',
    racketId: 'r-6',
    customerId: 'c-priya',
    status: 'collected',
    mainsStringId: 'st-rpm',
    crossesStringId: 'st-vs',
    gaugeMm: 1.25,
    tensionMainsLb: 55,
    tensionCrossesLb: 50.5,
    priceCents: 5500,
    strungAt: days(-44),
    dueAt: days(5),
    feedback: 'spot-on',
  },
  {
    id: 'j-095',
    racketId: 'r-5',
    customerId: 'c-dan',
    status: 'collected',
    mainsStringId: 'st-bg65',
    crossesStringId: 'st-bg65',
    gaugeMm: 0.7,
    tensionMainsLb: 26,
    tensionCrossesLb: 28,
    priceCents: 2200,
    strungAt: days(-60),
    dueAt: days(6),
  },
]

export const reels: Reel[] = [
  { id: 'reel-1', stringId: 'st-rpm', gaugeMm: 1.25, metresLeft: 12 },
  { id: 'reel-2', stringId: 'st-alu', gaugeMm: 1.25, metresLeft: 96 },
  { id: 'reel-3', stringId: 'st-nxt', gaugeMm: 1.3, metresLeft: 140 },
]

/* ---- lookups ---- */

/**
 * Only the string catalogue is looked up from here now. Customers, rackets and
 * models are held by the job store instead, because a racket picked out of the
 * shared catalogue is created at runtime and would never appear in a fixture.
 */
export function getString(id: string): StringModel {
  const found = strings.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown string ${id}`)
  return found
}
