/**
 * Civic complaint taxonomy: the single source of truth for departments and
 * categories. Used by the triage pipeline (Clef criteria + rules fallback),
 * the API (labels in responses) and the dashboard (filters, icons).
 *
 * Icon names refer to the web icon registry (app/constants/icons.ts).
 */

export type DepartmentId =
  | 'roads'
  | 'water'
  | 'drainage'
  | 'waste'
  | 'power'
  | 'parks'
  | 'safety'
  | 'planning'

export interface CategoryDef {
  id: string
  label: string
  /** Shown to Clef as the option's meaning */
  description: string
  /** Lower-case keywords for the rules fallback (English + common romanised Hindi/Kannada) */
  keywords: string[]
}

export interface DepartmentDef {
  id: DepartmentId
  label: string
  short: string
  description: string
  icon: string
  categories: CategoryDef[]
}

const other = (scope: string): CategoryDef => ({
  id: 'other',
  label: 'Other',
  description: `Any other ${scope} problem`,
  keywords: [],
})

export const DEPARTMENTS: DepartmentDef[] = [
  {
    id: 'roads',
    label: 'Roads & Transport',
    short: 'Roads',
    description: 'Road surfaces, footpaths, traffic signals, road signs and parking',
    icon: 'construction',
    categories: [
      { id: 'pothole', label: 'Pothole', description: 'A hole or crater in the road surface', keywords: ['pothole', 'potholes', 'hole in road', 'gaddha', 'gadda', 'crater'] },
      { id: 'road_damage', label: 'Road damage', description: 'Cracked, broken, sunken or unfinished road surface', keywords: ['road damage', 'broken road', 'cracked road', 'road broken', 'sadak', 'road dug', 'tar'] },
      { id: 'footpath_damage', label: 'Broken footpath', description: 'Damaged sidewalk, footpath or broken paver tiles', keywords: ['footpath', 'sidewalk', 'pavement', 'paver', 'tiles broken'] },
      { id: 'traffic_signal', label: 'Traffic signal fault', description: 'Traffic light not working or malfunctioning', keywords: ['signal', 'traffic light', 'traffic signal'] },
      { id: 'signage', label: 'Damaged signage', description: 'Missing, fallen or unreadable road signs and boards', keywords: ['sign board', 'signboard', 'road sign', 'name board'] },
      { id: 'illegal_parking', label: 'Illegal parking', description: 'Vehicles parked illegally, abandoned vehicles blocking roads', keywords: ['parking', 'parked', 'abandoned vehicle', 'wrong side'] },
      other('road or traffic'),
    ],
  },
  {
    id: 'water',
    label: 'Water Supply',
    short: 'Water',
    description: 'Drinking water pipelines, supply, pressure and water quality',
    icon: 'droplet',
    categories: [
      { id: 'pipe_leak', label: 'Pipe leak', description: 'Leaking or burst water pipe, water gushing on the road', keywords: ['leak', 'leaking', 'burst', 'pipe', 'water wastage', 'paani beh'] },
      { id: 'no_supply', label: 'No water supply', description: 'Taps dry, no municipal water supply', keywords: ['no water', 'water not coming', 'paani nahi', 'dry tap', 'no supply'] },
      { id: 'contaminated_water', label: 'Contaminated water', description: 'Dirty, smelly or discoloured drinking water', keywords: ['dirty water', 'contaminated', 'smelly water', 'muddy water', 'ganda paani'] },
      { id: 'low_pressure', label: 'Low pressure', description: 'Water arrives with very low pressure', keywords: ['low pressure', 'pressure'] },
      other('water supply'),
    ],
  },
  {
    id: 'drainage',
    label: 'Sewage & Drainage',
    short: 'Drainage',
    description: 'Storm drains, sewage lines, manholes and flooding',
    icon: 'waves',
    categories: [
      { id: 'blocked_drain', label: 'Blocked drain', description: 'Clogged or choked storm drain or gutter', keywords: ['drain', 'gutter', 'clogged', 'blocked', 'nala', 'naali'] },
      { id: 'sewage_overflow', label: 'Sewage overflow', description: 'Sewage overflowing onto the street', keywords: ['sewage', 'sewer', 'overflow', 'stink', 'smell'] },
      { id: 'waterlogging', label: 'Waterlogging', description: 'Stagnant water or flooding on roads after rain', keywords: ['waterlogging', 'water logging', 'flood', 'flooded', 'stagnant', 'rain water'] },
      { id: 'open_manhole', label: 'Open manhole', description: 'Missing or broken manhole cover', keywords: ['manhole', 'open pit', 'cover missing'] },
      other('drainage'),
    ],
  },
  {
    id: 'waste',
    label: 'Waste Management',
    short: 'Waste',
    description: 'Garbage collection, dumping, bins and sanitation',
    icon: 'trash',
    categories: [
      { id: 'garbage_dump', label: 'Garbage dump', description: 'Pile of garbage dumped in a public place', keywords: ['garbage', 'trash', 'waste', 'dump', 'kachra', 'kasa', 'litter', 'rubbish'] },
      { id: 'overflowing_bin', label: 'Overflowing bin', description: 'Public dustbin full and overflowing', keywords: ['bin', 'dustbin', 'overflowing'] },
      { id: 'missed_collection', label: 'Missed collection', description: 'Garbage not collected from homes or street', keywords: ['not collected', 'collection', 'garbage truck', 'pickup'] },
      { id: 'waste_burning', label: 'Waste burning', description: 'Garbage or leaves being burned in the open', keywords: ['burning', 'smoke', 'fire garbage', 'burnt'] },
      { id: 'dead_animal', label: 'Dead animal', description: 'Dead animal carcass on the road or public space', keywords: ['dead animal', 'dead dog', 'carcass', 'dead cow'] },
      other('waste'),
    ],
  },
  {
    id: 'power',
    label: 'Streetlights & Power',
    short: 'Power',
    description: 'Streetlights, electric poles, wiring and transformers',
    icon: 'zap',
    categories: [
      { id: 'streetlight_out', label: 'Streetlight out', description: 'Streetlight not working, flickering or dark street', keywords: ['streetlight', 'street light', 'lamp', 'dark street', 'light not working', 'batti'] },
      { id: 'exposed_wiring', label: 'Exposed wiring', description: 'Hanging, exposed or sparking electric wires', keywords: ['wire', 'wires', 'cable', 'sparking', 'spark', 'electric shock', 'current'] },
      { id: 'fallen_pole', label: 'Fallen pole', description: 'Electric pole fallen, leaning or damaged', keywords: ['pole', 'electric pole', 'leaning pole'] },
      { id: 'transformer_issue', label: 'Transformer issue', description: 'Transformer sparking, leaking oil or making noise', keywords: ['transformer', 'power cut', 'bijli', 'outage'] },
      other('electrical'),
    ],
  },
  {
    id: 'parks',
    label: 'Parks & Trees',
    short: 'Parks',
    description: 'Trees, branches, parks, playgrounds and public green spaces',
    icon: 'trees',
    categories: [
      { id: 'fallen_tree', label: 'Fallen tree', description: 'Tree or large branch fallen or about to fall', keywords: ['tree', 'branch', 'fallen tree', 'uprooted', 'ped'] },
      { id: 'overgrown_vegetation', label: 'Overgrown vegetation', description: 'Overgrown bushes, weeds or branches blocking the way', keywords: ['overgrown', 'bushes', 'weeds', 'grass', 'pruning'] },
      { id: 'park_damage', label: 'Park damage', description: 'Broken benches, play equipment, fences or lights in a park', keywords: ['park', 'playground', 'bench', 'swing', 'garden'] },
      other('park or tree'),
    ],
  },
  {
    id: 'safety',
    label: 'Public Safety',
    short: 'Safety',
    description: 'Stray animals, unsafe structures and fire hazards',
    icon: 'shield',
    categories: [
      { id: 'stray_animals', label: 'Stray animals', description: 'Aggressive stray dogs or cattle on roads', keywords: ['stray', 'dog', 'dogs', 'cattle', 'cow', 'monkey', 'bite'] },
      { id: 'unsafe_structure', label: 'Unsafe structure', description: 'Building, wall or bridge that looks about to collapse', keywords: ['collapse', 'crack in wall', 'unsafe', 'dilapidated', 'falling'] },
      { id: 'fire_hazard', label: 'Fire hazard', description: 'Fire risk, gas leak or flammable material in public', keywords: ['fire', 'gas leak', 'flammable', 'aag'] },
      other('public safety'),
    ],
  },
  {
    id: 'planning',
    label: 'Encroachment & Buildings',
    short: 'Planning',
    description: 'Encroachments, illegal construction and hoardings',
    icon: 'building',
    categories: [
      { id: 'encroachment', label: 'Encroachment', description: 'Shops, stalls or structures occupying footpaths or roads', keywords: ['encroachment', 'encroach', 'hawker', 'stall', 'occupied footpath'] },
      { id: 'illegal_construction', label: 'Illegal construction', description: 'Unauthorised construction or construction debris on public land', keywords: ['illegal construction', 'construction', 'debris', 'building material'] },
      { id: 'illegal_hoarding', label: 'Illegal hoarding', description: 'Unauthorised or dangerous hoardings, banners and posters', keywords: ['hoarding', 'banner', 'poster', 'billboard', 'flex'] },
      other('building or land use'),
    ],
  },
]

export const DEPARTMENT_IDS = DEPARTMENTS.map((d) => d.id)

const DEPT_BY_ID = new Map(DEPARTMENTS.map((d) => [d.id, d]))

export function isDepartmentId(value: unknown): value is DepartmentId {
  return typeof value === 'string' && DEPT_BY_ID.has(value as DepartmentId)
}

export function getDepartment(id: string): DepartmentDef | undefined {
  return DEPT_BY_ID.get(id as DepartmentId)
}

export function getCategory(departmentId: string, categoryId: string): CategoryDef | undefined {
  return getDepartment(departmentId)?.categories.find((c) => c.id === categoryId)
}

export function departmentLabel(id: string): string {
  return getDepartment(id)?.label ?? 'Unassigned'
}

export function categoryLabel(departmentId: string, categoryId: string): string {
  return getCategory(departmentId, categoryId)?.label ?? 'Other'
}

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
export type Severity = (typeof SEVERITIES)[number]

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const STATUSES = ['received', 'triaged', 'in_progress', 'resolved', 'rejected'] as const
export type ComplaintStatus = (typeof STATUSES)[number]

export const OPEN_STATUSES: ComplaintStatus[] = ['received', 'triaged', 'in_progress']

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  received: 'Received',
  triaged: 'Triaged',
  in_progress: 'In progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
}
