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
import { Button } from '../../../components/ui/Button'
import { SessionReportCard } from '../../../components/SessionReportCard'
import { SessionReportForm } from '../../../components/coach/SessionReportForm'

interface CoachBookingEvent {
  id: string
  athleteId: string
  athleteName: string
  athletePhoto: string | null
  athletePosition: string | null
  sessionDate: string
  startTime: string
  endTime: string
  status: string
  isPast: boolean
  report: SessionReport | null
  lastReport: SessionReport | null
}

export function CoachCalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CoachBookingEvent | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null)
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
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profileData?.id) { setLoading(false); return }
      setCoachProfileId(profileData.id)

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          status,
          athlete_id,
          slot_id,
          athlete_profiles (id, name, photo_url, position),
          availability_slots (start_time, end_time),
          session_reports (id, session_summary, strength_1, strength_2, strength_3,
            improvement_1, improvement_2, improvement_3,
            drill_1_name, drill_1_frequency, drill_2_name, drill_2_frequency,
            drill_3_name, drill_3_frequency, next_session_objective,
            session_rating, session_date, coach_id, athlete_id, booking_id,
            skills_assessed, is_visible_to_athlete, created_at, updated_at)
        `)
        .eq('coach_id', profileData.id)
        .order('session_date', { ascending: true })

      if (error) { console.error('Error fetching bookings:', error); return }

      const isPast = (date: string) => new Date(date + 'T23:59:59') < new Date()

      // Fetch last report per athlete for upcoming session previews
      const athleteIds = [...new Set((data || []).map((b: any) => b.athlete_id))]
      const lastReports: Record<string, SessionReport> = {}

      if (athleteIds.length > 0) {
        for (const athId of athleteIds) {
          const { data: reports } = await supabase
            .from('session_reports')
            .select('*')
            .eq('coach_id', profileData.id)
            .eq('athlete_id', athId)
            .order('session_date', { ascending: false })
            .limit(1)
          if (reports?.[0]) lastReports[athId] = reports[0]
        }
      }

      const calendarEvents = (data || []).map((booking: any) => {
        const past = isPast(booking.session_date)
        const report: SessionReport | null = booking.session_reports?.[0] || booking.session_reports || null
        const hasReport = !!report
        return {
          id: booking.id,
          title: booking.athlete_profiles?.name || 'Unknown',
          start: `${booking.session_date}T${booking.availability_slots?.start_time || '09:00'}`,
          end: `${booking.session_date}T${booking.availability_slots?.end_time || '10:00'}`,
          backgroundColor: past ? (hasReport ? '#16A34A' : '#6B7280') : '#2563EB',
          borderColor: past ? (hasReport ? '#15803D' : '#4B5563') : '#1D4ED8',
          textColor: '#FFFFFF',
          extendedProps: {
            bookingId: booking.id,
            athleteId: booking.athlete_id,
            athleteName: booking.athlete_profiles?.name || 'Unknown',
            athletePhoto: booking.athlete_profiles?.photo_url || null,
            athletePosition: booking.athlete_profiles?.position || null,
            status: booking.status,
            sessionDate: booking.session_date,
            startTime: booking.availability_slots?.start_time || '',
            endTime: booking.availability_slots?.end_time || '',
            isPast: past,
            hasReport,
            report,
            lastReport: lastReports[booking.athlete_id] || null,
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
      athleteId: props.athleteId,
      athleteName: props.athleteName,
      athletePhoto: props.athletePhoto,
      athletePosition: props.athletePosition,
      sessionDate: props.sessionDate,
      startTime: props.startTime,
      endTime: props.endTime,
      status: props.status,
      isPast: props.isPast,
      report: props.report,
      lastReport: props.lastReport,
    })
    setShowReport(false)
    setShowReportForm(false)
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleReportSaved = (report: SessionReport) => {
    setShowReportForm(false)
    setSelectedEvent({
      ...selectedEvent!,
      report,
    })
    // Refresh events
    fetchBookings()
  }

  return (
    <AppLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            My Coaching Schedule
          </h1>
          <div className="flex items-center gap-4">
            {/* Color Legend */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" /> Upcoming
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> No report
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" /> Reported
              </span>
            </div>
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
            />
          </div>
        )}
      </div>

      {/* Slide-Over Panel */}
      <SlideOver
        open={!!selectedEvent && !showReportForm}
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

            {/* Athlete Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
              <Avatar src={selectedEvent.athletePhoto} name={selectedEvent.athleteName} size="lg" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50">
                  {selectedEvent.athleteName}
                </p>
                {selectedEvent.athletePosition && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedEvent.athletePosition}
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

            {/* Upcoming session — last report preview */}
            {!selectedEvent.isPast && selectedEvent.lastReport && (
              <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📋 Last Report ({new Date(selectedEvent.lastReport.session_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                </p>
                {selectedEvent.lastReport.next_session_objective && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    Next Objective: "{selectedEvent.lastReport.next_session_objective}"
                  </p>
                )}
                <button
                  onClick={() => setShowReport(true)}
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium mt-1"
                >
                  View Full Last Report →
                </button>
              </div>
            )}

            {!selectedEvent.isPast && !selectedEvent.lastReport && (
              <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No previous reports for this athlete.
                </p>
              </div>
            )}

            {/* Past session without report */}
            {selectedEvent.isPast && !selectedEvent.report && !showReportForm && (
              <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <p className="text-sm font-medium text-[#D97706] mb-2">
                  No session report written yet
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowReportForm(true)}
                  className="bg-[#2563EB] text-white"
                >
                  Write Session Report
                </Button>
              </div>
            )}

            {/* Past session with report */}
            {selectedEvent.isPast && selectedEvent.report && !showReport && (
              <div className="pb-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <p className="text-sm text-[#16A34A] font-medium mb-2">
                  Report submitted
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowReport(true)}
                    className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                  >
                    View Report
                  </button>
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 font-medium"
                  >
                    Edit Report
                  </button>
                </div>
              </div>
            )}

            {/* Actions for upcoming */}
            {!selectedEvent.isPast && (
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                >
                  Message Athlete
                </a>
                <a
                  href="#"
                  className="text-sm text-[#2563EB] hover:text-[#1d4ed8] font-medium"
                >
                  View Profile
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
                <SessionReportCard report={selectedEvent.report} />
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Report Form Slide-Over */}
      {showReportForm && selectedEvent && coachProfileId && (
        <SlideOver
          open={showReportForm}
          onClose={() => setShowReportForm(false)}
          title={selectedEvent.report ? 'Edit Report' : 'Write Session Report'}
        >
          <SessionReportForm
            bookingId={selectedEvent.id}
            athleteId={selectedEvent.athleteId}
            coachId={coachProfileId}
            athleteName={selectedEvent.athleteName}
            athletePosition={selectedEvent.athletePosition}
            sessionDate={selectedEvent.sessionDate}
            existingReport={selectedEvent.report}
            onSave={handleReportSaved}
            onClose={() => setShowReportForm(false)}
          />
        </SlideOver>
      )}

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