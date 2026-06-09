import {
  HiOutlineSquares2X2,
  HiOutlineBeaker,
  HiOutlineHeart,
  HiOutlineWrenchScrewdriver,
  HiOutlineUserGroup,
  HiOutlineCog6Tooth,
  HiOutlineArchiveBox,
  HiOutlineGlobeAlt,
  HiOutlineTag,
  HiOutlineHome,
  HiOutlineChartPie,
  HiOutlineBanknotes,
  HiOutlineDocumentText,
} from 'react-icons/hi2'
import { GiCow, GiBuffaloHead, GiGoat, GiSheep, GiGrain, GiMilkCarton } from 'react-icons/gi'
import { TbTractor } from 'react-icons/tb'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: HiOutlineSquares2X2 },
  { to: '/animals', label: 'Animals', Icon: GiCow },
  { to: '/milking', label: 'Milking', Icon: GiMilkCarton },
  { to: '/expenses', label: 'Expenses', Icon: HiOutlineBanknotes },
  { to: '/income', label: 'Income', Icon: HiOutlineChartPie },
  { to: '/reports', label: 'Reports', Icon: HiOutlineDocumentText },
  { to: '/settings', label: 'Settings', Icon: HiOutlineCog6Tooth },
]

export const APP_ICON = TbTractor

export const EXPENSE_CATEGORIES = [
  { value: 'feed', label: 'Feed', color: 'bg-amber-50 text-amber-900 border-amber-200', Icon: GiGrain },
  { value: 'medicine', label: 'Medicine', color: 'bg-rose-50 text-rose-900 border-rose-200', Icon: HiOutlineBeaker },
  { value: 'vet', label: 'Vet', color: 'bg-sky-50 text-sky-900 border-sky-200', Icon: HiOutlineHeart },
  { value: 'labour', label: 'Labour', color: 'bg-violet-50 text-violet-900 border-violet-200', Icon: HiOutlineUserGroup },
  { value: 'equipment', label: 'Equipment', color: 'bg-slate-50 text-slate-900 border-slate-200', Icon: HiOutlineWrenchScrewdriver },
  { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-900 border-gray-200', Icon: HiOutlineArchiveBox },
]

export const INCOME_TYPES = [
  { value: 'milk_sale', label: 'Milk Sale', color: 'bg-blue-50 text-blue-900 border-blue-200', Icon: GiMilkCarton },
  { value: 'manure', label: 'Manure', color: 'bg-orange-50 text-orange-900 border-orange-200', Icon: HiOutlineArchiveBox },
  { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-900 border-gray-200', Icon: HiOutlineTag },
]

export const SCOPE_OPTIONS = [
  { value: 'animal', label: 'Specific Animal', color: 'bg-emerald-50 text-emerald-900 border-emerald-200', Icon: GiCow },
  { value: 'species', label: 'All of a Species', color: 'bg-teal-50 text-teal-900 border-teal-200', Icon: GiBuffaloHead },
  { value: 'common', label: 'Whole Farm', color: 'bg-green-50 text-green-900 border-green-200', Icon: HiOutlineHome },
]

export const EXPENSE_SCOPE_OPTIONS = [
  ...SCOPE_OPTIONS,
  { value: 'unassigned', label: 'Not Added to Cattle', color: 'bg-slate-50 text-slate-900 border-slate-200', Icon: HiOutlineArchiveBox },
]

export const FILTER_SCOPE_OPTIONS = [
  { value: '', label: 'All scopes', color: 'bg-gray-50 text-gray-800 border-gray-200', Icon: HiOutlineGlobeAlt },
  { value: 'animal', label: 'Individual Animal', color: 'bg-emerald-50 text-emerald-900 border-emerald-200', Icon: GiCow },
  { value: 'species', label: 'Species', color: 'bg-teal-50 text-teal-900 border-teal-200', Icon: GiBuffaloHead },
  { value: 'common', label: 'Whole Farm', color: 'bg-green-50 text-green-900 border-green-200', Icon: HiOutlineHome },
]

export const EXPENSE_FILTER_SCOPE_OPTIONS = [
  ...FILTER_SCOPE_OPTIONS,
  { value: 'unassigned', label: 'Not Added to Cattle', color: 'bg-slate-50 text-slate-900 border-slate-200', Icon: HiOutlineArchiveBox },
]

export const ANIMAL_STATUS_OPTIONS = [
  { value: 'active', label: 'Unsold', color: 'bg-green-50 text-green-900 border-green-200', Icon: GiCow },
  { value: 'sold', label: 'Sold', color: 'bg-amber-50 text-amber-900 border-amber-200', Icon: HiOutlineTag },
  { value: 'all', label: 'All animals', color: 'bg-gray-50 text-gray-900 border-gray-200', Icon: HiOutlineGlobeAlt },
]

export const EXPORT_SCOPE_OPTIONS = [
  { value: 'farm', label: 'Whole farm', color: 'bg-green-50 text-green-900 border-green-200', Icon: HiOutlineHome },
  { value: 'species', label: 'By species', color: 'bg-teal-50 text-teal-900 border-teal-200', Icon: GiBuffaloHead },
  { value: 'animal', label: 'By animal', color: 'bg-emerald-50 text-emerald-900 border-emerald-200', Icon: GiCow },
]

export const SPECIES_ICON_MAP = {
  buffalo: GiBuffaloHead,
  cow: GiCow,
  goat: GiGoat,
  sheep: GiSheep,
}

export function speciesSelectOptions(speciesList) {
  return [
    { value: '', label: 'All species', color: 'bg-gray-50 text-gray-800 border-gray-200', Icon: HiOutlineGlobeAlt },
    ...speciesList.map((s) => {
      const key = s.toLowerCase()
      const Icon = SPECIES_ICON_MAP[key] || GiCow
      return {
        value: key,
        label: s.charAt(0).toUpperCase() + s.slice(1),
        color: 'bg-lime-50 text-lime-900 border-lime-200',
        Icon,
      }
    }),
  ]
}

export function animalSelectOptions(animals) {
  return animals.map((a) => ({
    value: a.id,
    label: `${a.name}${a.tag_number ? ` (${a.tag_number})` : ''}`,
    color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    Icon: SPECIES_ICON_MAP[a.species?.toLowerCase()] || GiCow,
  }))
}

export function categoryFilterOptions() {
  return [
    { value: '', label: 'All categories', color: 'bg-gray-50 text-gray-800 border-gray-200', Icon: HiOutlineGlobeAlt },
    ...EXPENSE_CATEGORIES,
  ]
}

export function incomeTypeFilterOptions() {
  return [
    { value: '', label: 'All types', color: 'bg-gray-50 text-gray-800 border-gray-200', Icon: HiOutlineGlobeAlt },
    ...INCOME_TYPES,
  ]
}
