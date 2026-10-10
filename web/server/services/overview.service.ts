import { DEPARTMENTS, OPEN_STATUSES, type Severity } from '#shared/triage/taxonomy'
import type { Priority } from '#shared/triage/priority'
import type { OverviewResponse } from '#shared/types/complaint'
import { complaintRepository as repo } from '../repositories/complaint.repository'
import { toSummary } from './complaint.mapper'

/** Dashboard aggregates. Computed in memory; fine at hackathon scale. */

const DAY_MS = 86_400_000
const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export const overviewService = {
  async build(department?: string): Promise<OverviewResponse> {
    const rows = await repo.listForOverview(department)
    const now = Date.now()
    const isOpen = (s: string) => (OPEN_STATUSES as string[]).includes(s)
    const open = rows.filter((r) => isOpen(r.status))

    const severity: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    const priority: Record<Priority, number> = { P1: 0, P2: 0, P3: 0, P4: 0 }
    for (const r of open) {
      severity[r.severity]++
      priority[r.priority]++
    }

    // New complaints per day, last 14 days (oldest first).
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const series = Array.from({ length: 14 }, (_, i) => {
      const dayStart = startOfToday.getTime() - (13 - i) * DAY_MS
      const date = new Date(dayStart)
      return {
        date: date.toISOString().slice(0, 10),
        label: WEEKDAY[date.getDay()]!,
        value: rows.filter((r) => r.createdAt.getTime() >= dayStart && r.createdAt.getTime() < dayStart + DAY_MS).length,
      }
    })

    const triageSeconds = rows
      .map((r) => r.aiTrace.reduce((sum, step) => sum + step.ms, 0) / 1000)
      .filter((s) => s > 0)

    const departments = DEPARTMENTS.filter((d) => !department || d.id === department).map((d) => {
      const mine = rows.filter((r) => r.department === d.id)
      const mineOpen = mine.filter((r) => isOpen(r.status))
      const p1 = mineOpen.filter((r) => r.priority === 'P1').length
      return {
        id: d.id,
        label: d.label,
        icon: d.icon,
        open: mineOpen.length,
        p1,
        resolved: mine.filter((r) => r.status === 'resolved').length,
        avgPriority: mineOpen.length
          ? Math.round(mineOpen.reduce((sum, r) => sum + r.priorityScore, 0) / mineOpen.length)
          : 0,
        status: (p1 >= 3 ? 'critical' : p1 >= 1 || mineOpen.length >= 8 ? 'watch' : 'healthy') as
          | 'healthy'
          | 'watch'
          | 'critical',
      }
    })

    const latestCritical = open
      .filter((r) => r.priority === 'P1' || r.priority === 'P2')
      .sort((a, b) => b.priorityScore - a.priorityScore || b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
    const counts = await repo.photoCounts(latestCritical.map((r) => r.id))

    return {
      stats: {
        open: open.length,
        p1Open: priority.P1,
        resolved30d: rows.filter((r) => r.status === 'resolved' && r.resolvedAt && now - r.resolvedAt.getTime() <= 30 * DAY_MS).length,
        medianTriageSeconds: median(triageSeconds),
        total: rows.length,
        reportsMerged: await repo.countMergedReports(department),
      },
      series,
      severity,
      priority,
      departments,
      latestCritical: latestCritical.map((r) => toSummary(r, counts.get(r.id) ?? 1)),
    }
  },
}
