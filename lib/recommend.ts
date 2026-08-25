import { getString } from './mock-data'
import type { Job, RacketModel } from './types'

/**
 * SEAM — replace the body of `recommend()` with the real engine.
 *
 * The UI only ever touches this interface, so swapping the implementation
 * is a single-file change. Nothing downstream reads the internals.
 *
 * The functions take a model and the previous job rather than an id, so a
 * frame picked out of the shared catalogue works the same as a seeded one —
 * there is no fixture lookup left to fail (BACKEND doc §7.0).
 */
export interface Recommendation {
  tensionMainsLb: number
  tensionCrossesLb: number
  stringId: string
  gaugeMm: number
  /** Plain-language reasons. The UI shows at most two. */
  because: string[]
  /** 'same-again' short-circuits the wizard entirely. */
  source: 'same-again' | 'engine' | 'default'
  confidence: 'high' | 'medium' | 'low'
}

export interface GuardrailWarning {
  kind: 'over-max' | 'under-min'
  message: string
}

/**
 * Advisory only — a stringer can always override (FRONTEND doc §4.4).
 * Both ends of the manufacturer's stated range now come from the catalogue,
 * so this fires on real numbers rather than a hardcoded ceiling.
 */
export function checkGuardrail(
  model: RacketModel,
  tensionLb: number,
): GuardrailWarning | undefined {
  if (model.maxTensionLb && tensionLb > model.maxTensionLb) {
    return {
      kind: 'over-max',
      message: `Above ${model.brand}'s stated max of ${model.maxTensionLb}lb for this frame.`,
    }
  }
  if (model.tensionMinLb && tensionLb < model.tensionMinLb) {
    return {
      kind: 'under-min',
      message: `Below ${model.brand}'s stated min of ${model.tensionMinLb}lb for this frame.`,
    }
  }
  return undefined
}

/** Derived from the previous job — this is what SAME AGAIN reads. */
export function sameAgain(last: Job | undefined): Recommendation | undefined {
  if (!last) return undefined

  const because: string[] = []
  if (last.feedback === 'spot-on') because.push('Last job felt spot-on')
  if (last.snapped) because.push('Last set snapped early')
  if (last.feedback === 'too-tight') because.push('Last job played too tight')

  return {
    tensionMainsLb: last.tensionMainsLb,
    tensionCrossesLb: last.tensionCrossesLb,
    stringId: last.mainsStringId,
    gaugeMm: last.gaugeMm,
    because,
    source: 'same-again',
    confidence: 'high',
  }
}

/**
 * MOCK. Nudges the last setup using feedback and frame stiffness so the UI has
 * something believable to render. The real engine replaces this wholesale.
 */
export function recommend(model: RacketModel, last: Job | undefined): Recommendation {
  if (!last) {
    const isBadminton = model.sport === 'badminton'
    // With no history, the manufacturer's own range is the safest anchor —
    // the middle of it, which is what the catalogue gives us for tennis.
    const mid =
      model.tensionMinLb && model.maxTensionLb
        ? Math.round((model.tensionMinLb + model.maxTensionLb) / 2)
        : 54

    return {
      tensionMainsLb: isBadminton ? 26 : mid,
      tensionCrossesLb: isBadminton ? 28 : mid - 2,
      stringId: isBadminton ? 'st-bg65' : 'st-nxt',
      gaugeMm: isBadminton ? 0.7 : 1.3,
      because: [
        model.tensionMinLb && model.maxTensionLb
          ? `No history yet — middle of ${model.brand}'s ${model.tensionMinLb}–${model.maxTensionLb}lb range`
          : 'No history yet — starting from a safe mid-range',
      ],
      source: 'default',
      confidence: 'low',
    }
  }

  let delta = 0
  const because: string[] = []

  if (last.feedback === 'too-tight') {
    delta = -2
    because.push('You said the last job played too tight')
  } else if (last.feedback === 'too-loose') {
    delta = 2
    because.push('You said the last job played too loose')
  } else if (last.snapped || last.feedback === 'broke-early') {
    delta = -1
    because.push('Last set broke early — easing off helps it last')
  } else if (last.feedback === 'spot-on') {
    because.push('Last job felt spot-on, holding it')
  }

  if (model.ra >= 68 && delta === 0) {
    delta = -1
    because.push(`${model.model} is a firm frame (RA ${model.ra})`)
  }

  return {
    tensionMainsLb: last.tensionMainsLb + delta,
    tensionCrossesLb: last.tensionCrossesLb + delta,
    stringId: last.mainsStringId,
    gaugeMm: last.gaugeMm,
    because: because.slice(0, 2),
    source: 'engine',
    confidence: last.feedback ? 'high' : 'medium',
  }
}

/** Human label for a recommendation's string + gauge. */
export function describeSetup(rec: Recommendation): string {
  const s = getString(rec.stringId)
  return `${s.brand} ${s.name} ${rec.gaugeMm.toFixed(2)}mm`
}

/** Does this job match the recommendation exactly? Used to badge overrides. */
export function isOverride(job: Pick<Job, 'tensionMainsLb'>, rec: Recommendation) {
  return job.tensionMainsLb !== rec.tensionMainsLb
}
