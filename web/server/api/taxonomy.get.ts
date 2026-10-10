import { DEPARTMENTS } from '#shared/triage/taxonomy'

export default defineEventHandler(() =>
  DEPARTMENTS.map(({ id, label, short, icon, description, categories }) => ({
    id,
    label,
    short,
    icon,
    description,
    categories: categories.map(({ id: cid, label: clabel }) => ({ id: cid, label: clabel })),
  })),
)
