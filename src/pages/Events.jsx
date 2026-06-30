import { useEffect, useMemo, useState } from 'react'
import { fetchAnimals } from '../api/animals'
import { fetchEvents, createEvent, deleteEvent } from '../api/events'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import StyledSelect from '../components/StyledSelect'
import {
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_METADATA,
  SPECIES_ICON_MAP,
} from '../constants/selectOptions'
import { capitalizeSpecies } from '../utils/format'
import { GiCow } from 'react-icons/gi'
import { HiOutlineGlobeAlt, HiOutlinePlus, HiOutlineMagnifyingGlass, HiOutlineCalendarDays, HiOutlineXMark, HiOutlineTrash } from 'react-icons/hi2'

// Colors specifically optimized for the circular backgrounds of the cards
const EVENT_CARD_COLORS = {
  'Vaccination': { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600' },
  'Deworming': { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600' },
  'Health Check': { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-600' },
  'Mating': { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-600' },
  'Pregnancy Check': { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-600' },
  'Birth': { bg: 'bg-orange-50 border-orange-100', text: 'text-orange-600' },
  'Ear Tagging': { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600' },
  'Weight Check': { bg: 'bg-cyan-50 border-cyan-100', text: 'text-cyan-600' },
  'Hoof Trimming': { bg: 'bg-amber-100/50 border-amber-200/50', text: 'text-amber-900' }, // Brown/Amber
  'Transfer': { bg: 'bg-slate-100/80 border-slate-200/60', text: 'text-slate-600' },
  'Medication': { bg: 'bg-teal-50 border-teal-100', text: 'text-teal-600' },
  'Other': { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600' },
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAnimalId, setModalAnimalId] = useState('')
  const [modalEventType, setModalEventType] = useState('Vaccination')
  const [modalEventDate, setModalEventDate] = useState('')
  const [modalNotes, setModalNotes] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  // Determine local date ISO string
  const { todayStr, yesterdayStr } = useMemo(() => {
    const today = new Date()
    const offset = today.getTimezoneOffset()
    
    const localToday = new Date(today.getTime() - (offset * 60 * 1000))
    const tStr = localToday.toISOString().split('T')[0]

    const yesterday = new Date(today.getTime() - (offset * 60 * 1000))
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]

    return { todayStr: tStr, yesterdayStr: yStr }
  }, [])

  // Load events and animals on mount
  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const [eventsRes, animalsRes] = await Promise.all([
        fetchEvents(),
        fetchAnimals({ status: 'active' }),
      ])
      if (!active) return
      if (eventsRes.error) {
        setError(eventsRes.error)
      } else {
        setEvents(eventsRes.data || [])
      }
      if (animalsRes.data) {
        setAnimals(animalsRes.data)
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  // Options for animal select in modal
  const animalOptions = useMemo(() => {
    return animals.map((a) => ({
      value: a.id,
      label: a.name,
      subLabel: a.tag_number ? `Tag: ${a.tag_number}` : undefined,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      Icon: SPECIES_ICON_MAP[a.species?.toLowerCase()] || GiCow,
    }))
  }, [animals])

  // Options for event type filter
  const filterTypeOptions = useMemo(() => {
    return [
      {
        value: 'All',
        label: 'All Events',
        Icon: HiOutlineGlobeAlt,
        color: 'bg-gray-50 text-gray-800 border-gray-200',
      },
      ...EVENT_TYPE_OPTIONS,
    ]
  }, [])

  // Filter events reactively
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (evt.animal?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (evt.animal?.tag_number || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === 'All' || evt.event_type === typeFilter

      return matchesSearch && matchesType
    })
  }, [events, searchTerm, typeFilter])

  // Group events by relative or formatted date
  const groupedEvents = useMemo(() => {
    const groups = []
    filteredEvents.forEach((evt) => {
      const dateStr = evt.event_date
      let groupKey
      if (dateStr === todayStr) {
        groupKey = 'Today'
      } else if (dateStr === yesterdayStr) {
        groupKey = 'Yesterday'
      } else {
        groupKey = formatEventDate(dateStr)
      }

      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.key === groupKey) {
        lastGroup.events.push(evt)
      } else {
        groups.push({
          key: groupKey,
          events: [evt],
        })
      }
    })
    return groups
  }, [filteredEvents, todayStr, yesterdayStr])

  // Open modal handler
  const openModal = () => {
    setModalAnimalId('')
    setModalEventType('Vaccination')
    setModalEventDate(todayStr)
    setModalNotes('')
    setFormErrors({})
    setModalError('')
    setModalOpen(true)
  }

  // Close modal handler
  const closeModal = () => {
    if (!submitting) {
      setModalOpen(false)
    }
  }

  const reloadEvents = async () => {
    const eventsRes = await fetchEvents()
    if (eventsRes.error) setError(eventsRes.error)
    else setEvents(eventsRes.data || [])
  }

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!modalAnimalId) errors.animalId = 'Animal is required'
    if (!modalEventType) errors.eventType = 'Event Type is required'
    if (!modalEventDate) errors.eventDate = 'Event Date is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle modal submit
  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setModalError('')
    if (!validateForm()) return

    setSubmitting(true)
    const { data, error: err } = await createEvent({
      animal_id: modalAnimalId,
      event_type: modalEventType,
      event_date: modalEventDate,
      notes: modalNotes.trim() || null,
    })
    setSubmitting(false)

    if (err) {
      setModalError(err)
      return
    }

    // Insert newly created event and sort
    setEvents((prev) => {
      const updated = [data, ...prev]
      return updated.sort((a, b) => {
        const dateCmp = b.event_date.localeCompare(a.event_date)
        if (dateCmp !== 0) return dateCmp
        return (b.created_at || '').localeCompare(a.created_at || '')
      })
    })

    setModalOpen(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error: err } = await deleteEvent(deleteId)
    setDeleteId(null)
    if (err) {
      setError(err)
      return
    }
    await reloadEvents()
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert-error">{error}</div>

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h2 className="page-title mb-0 text-gray-900 font-bold">Events</h2>
        <button
          type="button"
          onClick={openModal}
          className="btn-primary w-full sm:w-auto h-11 px-5 shadow-xs transition-transform duration-150 hover:scale-[1.01]"
        >
          <HiOutlinePlus size={18} />
          Add Event
        </button>
      </div>

      {/* Main timeline filters or cards */}
      {events.length === 0 ? (
        /* Empty State */
        <div className="card flex flex-col items-center justify-center text-center p-8 sm:p-16 border-dashed border-2 border-gray-200 bg-gray-50/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 border border-green-100 mb-6 animate-bounce">
            <HiOutlineCalendarDays size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No events recorded yet.</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
            Start keeping track of vaccinations, births, treatments and other farm activities.
          </p>
          <button
            type="button"
            onClick={openModal}
            className="btn-primary h-11 px-5"
          >
            <HiOutlinePlus size={18} />
            Add Event
          </button>
        </div>
      ) : (
        <>
          {/* Filters Card */}
          <div className="card mb-6 p-5">
            <div className="filter-row flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="filter-field flex-1 min-w-[200px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Search Animal</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search animal name or tag..."
                    className="form-input pl-10 h-11 text-gray-900 border-gray-200"
                  />
                  <HiOutlineMagnifyingGlass
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
              </div>
              <div className="filter-field sm:min-w-[220px]">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Event Type</label>
                <StyledSelect
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={filterTypeOptions}
                />
              </div>
            </div>
          </div>

          {/* Cards Timeline */}
          {filteredEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-16 text-sm bg-white rounded-2xl border border-gray-100 shadow-xs">
              No matching events found.
            </p>
          ) : (
            <div className="relative border-l-2 border-green-200/40 ml-3 pl-5 md:ml-6 md:pl-8 space-y-8 py-2">
              {groupedEvents.map((group) => (
                <div key={group.key} className="relative">
                  {/* Timeline bullet/date node */}
                  <div className="absolute -left-[27px] md:-left-[39px] top-1 h-3.5 w-3.5 rounded-full bg-green-600 border-2 border-white ring-4 ring-green-100" />
                  
                  {/* Group Header - Uppercase with Divider */}
                  <div className="border-b border-gray-100/80 pb-2.5 mb-5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                      {group.key}
                    </h3>
                  </div>

                  {/* Group Events Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {group.events.map((evt) => {
                      const metadata = EVENT_TYPE_METADATA[evt.event_type] || {
                        Icon: HiOutlineCalendarDays,
                        color: 'bg-gray-50 text-gray-900 border-gray-200',
                      }
                      const cardColors = EVENT_CARD_COLORS[evt.event_type] || {
                        bg: 'bg-gray-50 border-gray-100',
                        text: 'text-gray-600',
                      }
                      const Icon = metadata.Icon

                      return (
                        <div
                          key={evt.id}
                          className="card relative flex flex-col justify-between p-6 rounded-2xl bg-white shadow-sm border border-gray-100/90 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                        >
                          <div className="absolute top-5 right-5 flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full shrink-0">
                              {formatEventDate(evt.event_date)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeleteId(evt.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                              aria-label={`Delete ${evt.event_type} event`}
                              title="Delete event"
                            >
                              <HiOutlineTrash size={15} aria-hidden />
                            </button>
                          </div>

                          <div className="flex flex-col items-start gap-4">
                            {/* Icon inside soft colored circular background */}
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full border shrink-0 ${cardColors.bg} ${cardColors.text}`}>
                              <Icon size={20} aria-hidden />
                            </div>

                            {/* Info */}
                            <div className="space-y-1 w-full pr-28">
                              <h4 className="font-bold text-gray-900 text-lg leading-tight">
                                {evt.event_type}
                              </h4>
                              <p className="text-sm font-semibold text-green-700 leading-normal">
                                {evt.animal
                                  ? `${capitalizeSpecies(evt.animal.species)} · ${evt.animal.name}`
                                  : '—'}
                              </p>
                            </div>
                          </div>

                          {evt.notes && (
                            <p className="text-sm text-gray-500 mt-4 whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-3.5">
                              {evt.notes}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[580px] rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-3.5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Add Farm Event</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                <HiOutlineXMark size={22} />
              </button>
            </div>

            {modalError && <div className="alert-error mb-4">{modalError}</div>}

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Animal *</label>
                <StyledSelect
                  value={modalAnimalId}
                  onChange={setModalAnimalId}
                  placeholder="Select animal"
                  options={animalOptions}
                />
                {formErrors.animalId && <p className="form-error mt-1 text-xs">{formErrors.animalId}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Event Type *</label>
                <StyledSelect
                  value={modalEventType}
                  onChange={setModalEventType}
                  placeholder="Select event type"
                  options={EVENT_TYPE_OPTIONS}
                />
                {formErrors.eventType && <p className="form-error mt-1 text-xs">{formErrors.eventType}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Event Date *</label>
                <input
                  type="date"
                  value={modalEventDate}
                  onChange={(e) => setModalEventDate(e.target.value)}
                  className="form-input h-11 text-gray-900 border-gray-200 placeholder:text-gray-400/80 cursor-pointer"
                  max={todayStr}
                />
                {formErrors.eventDate && <p className="form-error mt-1 text-xs">{formErrors.eventDate}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Notes</label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any additional details about this event..."
                  className="form-input min-h-[110px] resize-y text-gray-900 border-gray-200 placeholder:text-gray-400/80"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="mt-7 flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1 h-12 rounded-xl text-sm font-semibold transition-colors duration-150 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 h-12 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.99]"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Event"
        message="Are you sure you want to delete this event? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

// Local helper to format event dates as "D MMM YYYY" (e.g. "30 Jun 2026")
function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'))
  if (Number.isNaN(d.getTime())) return dateStr
  const day = d.getDate()
  const monthNamesFull = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const month = monthNamesFull[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}
