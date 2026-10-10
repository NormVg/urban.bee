import type { IconName } from '~/constants/icons'

export type DeltaTone = 'good' | 'bad' | 'neutral'

export interface StatMetric {
  id: string
  label: string
  value: string
  /** Short supporting line under the value */
  hint: string
  hintTone?: DeltaTone
  icon: IconName
  iconTone: 'blue' | 'orange'
}

export interface RequestDay {
  label: string
  value: number
  /** Full date for tooltips */
  date?: string
}
