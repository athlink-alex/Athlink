import { useEffect, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { useAuth } from '../../../context/AuthContext'
import { supabase, type SessionReport } from '../../../lib/supabase'
import { AppLayout } from '../../../components/layout/AppLayout'
import { SlideOver } from '../../../components/ui/SlideOver'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { SessionReportCard } from '../../../components/SessionReportCard'

interface BookingEvent {
  id: string
  coachName: string
  coachPhoto: string | null
  coachSport: string
  coachRating: number | null
  sessionDate: string
  startTime: string
  endTime: string
  status: string
  amount: number
  isPast: boolean
  report: SessionReport | null
}

export function AthleteCalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>(
    window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth'
  )
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    if (!user) return
    fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    if (!user) return

    try {
      const { data: profileData } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profileData?.id) { setLoading(false); return }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          status,
          payment_status,
          amount,
          coach_id,
          slot_id,
          coach_profiles (id, name, sport, avg_rating, photo_url),
          availability_slots (start_time, end_time),
          session_reports (id, session_summary, strength_1, strength_2, strength_3,
            improvement_1, improvement_2, improvement_3,
            drill_1_name, drill_1_frequency, drill_2_name, drill_2_frequency,
            drill_3_name, drill_3_frequency, next_session_objective,
            session_rating, session_date, coach_id, athlete_id, booking_id,
            skills_assessed, is_visible_to_athlete, created_at, updated_at)
        `)
        .eq('athlete_id', user.id)
        .order('session_date', { ascending: true })

      if (error) { console.error('Error fetching bookings:', error); return }

      const isPast = (date: string) => new Date(date + 'T23:59:59') < new Date()

      const calendarEvents = (data || []).map((booking: any) => {
        const past = isPast(booking.session_date)
        const report: SessionReport | null = booking.session_reports?.[0] || booking.session_reports || null
        return {
          id: booking.id,
          title: `Coach ${booking.coach_profiles?.name || 'Unknown'}`,
          start: `${booking.session_date}T${booking.availability_slots?.start_time || '09:00'}`,
          end: `${booking.session_date}T${booking.availability_slots?.end_time || '10:00'}`,
          backgroundColor: past ? '#6B7280' : '#2563EB',
          borderColor: past ? '#4B5563' : '#1D4ED8',
          textColor: '#FFFFFF',
          extendedProps: {
            bookingId: booking.id,
            coachName: booking.coach_profiles?.name || 'Unknown',
            coachPhoto: booking.coach_profiles?.photo_url || null,
            coachSport: booking.coach_profiles?.sport || '',
            coachRating: booking.coach_profiles?.avg_rating || null,
            status: booking.status,
            amount: booking.amount,
            sessionDate: booking.session_date,
            startTime: booking.availability_slots?.start_time || '',
            endTime: booking.availability_slots?.end_time || '',
            isPast: past,
            hasReport: !!report,
            report,
          },
        }
      })

      setEvents(calendarEvents)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps
    setSelectedEvent({
      id: props.bookingId,
      coachName: props.coachName,
      coachPhoto: props.coachPhoto,
      coachSport: props.coachSport,
      coachRating: props.coachRating,
      sessionDate: props.sessionDate,
      startTime: props.startTime,
      endTime: props.endTime,
      status: props.status,
      amount: props.amount,
      isPast: props.isPast,
      report: props.report,
    })
    setShowReport(false)
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${m} ${ampm}`
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            My Training Schedule
          </h1>
          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-[#F9FAFB] dark:bg-gray-800 rounded-[8px] p-1">
            {([
              { view: 'dayGridMonth' as const, label: 'Month' },
              { view: 'timeGridWeek' as const, label: 'Week' },
              { view: 'listWeek' as const, label: 'List' },
            ]).map(({ view, label }) => (
              <button
                key={view}
                onClick={() => {
                  setCurrentView(view)
                  calendarRef.current?.getApi().changeView(view)
                }}
                className={`px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${
                  currentView === view
                    ? 'bg-white dark:bg-gray-900 text-[#2563EB] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading schedule...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-[8px] border border-[#E5E7EB] dark:border-gray-700 p-4 transition-colors duration-200">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={currentView}
              events={events}
              eventClick={handleEventClick}
              headerToolbar={false}
              height="auto"
              dayMaxEvents={3}
              eventDisplay="block"
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              dayCellContent={(args) => (
                <div className="fc-daycell-content">
                  {args.dayNumberText}
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Slide-Over Panel */}
      <SlideOver
        open={!!selectedEvent}
        onClose={() => { setSelectedEvent(null); setShowReport(false) }}
        title="Session Details"
      >
        {selectedEvent && (
          <div className="p-6 space-y-4">
            {/* Status Label */}
            <div className="flex items-center gap-2">
              {selectedEvent.isPast ? (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Past Session</span>
              ) : (
                <span className="text-sm font-medium text-[#2563EB]">Upcoming Session</span>
              )}
            </div>

            {/* Coach Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
              <Avatar src={selectedEvent.coachPhoto} name={selectedEvent.coachName} size="lg" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50">
                  Coach {selectedEvent.coachName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedEvent.coachSport}
                </p>
                {selectedEvent.coachRating && (
                  <p className="text-sm text-[#F59E0B] mt-0.5">
                    ★ {selectedEvent.coachRating.toFixed(1)}
                  </p>
                )}
              </div>
            </div>

            {/* Session Details */}
            <div className="space-y-2 pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                📅 {formatDate(selectedEvent.sessionDate)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                🕐 {formatTime(selectedEvent.startTime)} – {formatTime(selectedEvent.endTime)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  status={
                    selectedEvent.status === 'completed' ? 'completed'
                    : selectedEvent.status === 'disputed' ? 'disputed'
                    : 'scheduled'
                  }
                />
              </div>
            </div>

            {/* Report Section */}
            {selectedEvent.isPast && selectedEvent.report && !showReport && (
              <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📋 Session Report Available
                </p>
                <button
                  onClick={() => setShowReport(true)}
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                >
                  View Report Card ↓
                </button>
              </div>
            )}

            {selectedEvent.isPast && !selectedEvent.report && (
              <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📋 No report yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your coach hasn't submitted a session report for this lesson yet.
                </p>
              </div>
            )}

            {/* Actions for upcoming */}
            {!selectedEvent.isPast && (
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                >
                  Message Coach
                </a>
                <a
                  href={`/coaches/${selectedEvent.id}`}
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                >
                  View Coach Profile
                </a>
              </div>
            )}

            {/* Full Report Card */}
            {showReport && selectedEvent.report && (
              <div className="pt-4 border-t border-[#E5E7EB] dark:border-gray-700">
                <button
                  onClick={() => setShowReport(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-3 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  Hide Report
                </button>
                <SessionReportCard report={selectedEvent.report} coachName={selectedEvent.coachName} />
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* FullCalendar CSS overrides */}
      <style>{`
        .fc { font-family: 'Inter', system-ui, sans-serif; }
        .fc .fc-toolbar-title { font-size: 1.1rem; font-weight: 600; }
        .fc .fc-button-primary {
          background-color: #2563EB;
          border-color: #2563EB;
          border-radius: 8px;
          font-size: 0.875rem;
        }
        .fc .fc-button-primary:hover { background-color: #1D4ED8; }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #1D4ED8;
          border-color: #1D4ED8;
        }
        .fc .fc-daygrid-day-number { font-size: 0.875rem; }
        .fc .fc-event {
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          padding: 1px 6px;
          cursor: pointer;
        }
        .fc .fc-event .fc-event-main { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fc .fc-daygrid-day-frame { min-height: 80px; }
        .fc .fc-list-event-time { font-size: 0.8rem; }
        .fc .fc-list-event-title { font-size: 0.875rem; font-weight: 500; }
        .fc th, .fc td { border-color: #E5E7EB; }
        .dark .fc th, .dark .fc td { border-color: #374151; }
        .dark .fc { color: #e5e7eb; }
        .dark .fc .fc-daygrid-day { background: #111827; }
        .dark .fc .fc-daygrid-day.fc-day-today { background: #1f2937; }
        .dark .fc .fc-list-day-cushion { background: #1f2937; }
        .dark .fc .fc-list-sticky .fc-list-day > * { background: #111827; }
        .dark .fc-daygrid-day-number { color: #d1d5db; }
        .dark .fc .fc-col-header-cell-cushion { color: #9ca3af; }
      `}</style>
    </AppLayout>
  )
}