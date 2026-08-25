import type { Job, MeterState } from './types'

export interface StringLife {
  /** 0–100. Clamped. */
  percent: number
  state: MeterState
  /** Negative when overdue. */
  daysLeft: number
}

export function stateFor(percent: number, snapped?: boolean): MeterState {
  if (snapped) return 'snapped'
  if (percent >= 60) return 'fresh'
  if (percent >= 25) return 'fading'
  return 'dead'
}

export function stringLife(job: Job, now = new Date()): StringLife {
  if (!job.strungAt || !job.dueAt) {
    return { percent: 100, state: stateFor(100, job.snapped), daysLeft: 0 }
  }
  const strung = new Date(job.strungAt).getTime()
  const due = new Date(job.dueAt).getTime()
  const total = Math.max(due - strung, 1)
  const elapsed = now.getTime() - strung
  const percent = Math.max(0, Math.min(100, Math.round((1 - elapsed / total) * 100)))
  const daysLeft = Math.round((due - now.getTime()) / 86_400_000)
  return { percent, state: stateFor(percent, job.snapped), daysLeft }
}

const STATE_LABEL: Record<MeterState, string> = {
  fresh: 'Fresh',
  fading: 'Fading',
  dead: 'Dead',
  snapped: 'Snapped',
}

export function stateLabel(state: MeterState): string {
  return STATE_LABEL[state]
}

/** Never colour-alone: this text always accompanies the meter. */
export function lifeSummary(life: StringLife): string {
  if (life.state === 'snapped') return 'Snapped'
  if (life.daysLeft < 0) return `${Math.abs(life.daysLeft)}d over`
  if (life.daysLeft === 0) return 'Due today'
  return `${life.daysLeft}d left`
}

/** Screen-reader label — never "chart". */
export function lifeAriaLabel(life: StringLife): string {
  if (life.state === 'snapped') return 'String bed snapped, needs restringing'
  const when =
    life.daysLeft < 0
      ? `overdue by about ${Math.abs(life.daysLeft)} days`
      : `due in about ${life.daysLeft} days`
  return `String life ${life.percent} percent, ${when}`
}
