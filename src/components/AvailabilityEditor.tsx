import { useState } from 'react'
import { useAvailability } from '../hooks/useAvailability'
import { Button } from './ui/Button'

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

interface AvailabilityEditorProps {
  coachProfileId: string
}

export function AvailabilityEditor({ coachProfileId }: AvailabilityEditorProps) {
  const { slots, loading, error, addSlot, removeSlot, refetch } = useAvailability(coachProfileId)
  const [addingDay, setAddingDay] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [saving, setSaving] = useState(false)

  const groupedSlots = DAYS.map((day) => ({
    ...day,
    slots: slots.filter((s) => s.day_of_week === day.value),
  }))

  const availableDays = DAYS.filter(
    (d) => !slots.some((s) => s.day_of_week === d.value)
  )

  const handleAddSlot = async () => {
    if (!addingDay) return
    setSaving(true)
    try {
      await addSlot({
        coach_id: coachProfileId,
        day_of_week: addingDay,
        start_time: startTime,
        end_time: endTime,
        is_booked: false,
      })
      setAddingDay(null)
      setStartTime('09:00')
      setEndTime('17:00')
    } catch {
      // error is set in the hook
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSlot = async (slotId: string) => {
    await removeSlot(slotId)
  }

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2563EB] mx-auto" />
        <p className="text-gray-500 text-sm mt-2">Loading availability...</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-[#DC2626] rounded-[8px] text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {groupedSlots
          .filter((day) => day.slots.length > 0)
          .map((day) => (
            <div key={day.value} className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-[8px]">
              <div>
                <span className="font-medium text-gray-900">{day.label}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {day.slots.map((s) => `${s.start_time} - ${s.end_time}`).join(', ')}
                </span>
              </div>
              <button
                onClick={() => day.slots.forEach((s) => handleRemoveSlot(s.id))}
                className="text-sm text-[#DC2626] hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}

        {slots.length === 0 && (
          <p className="text-gray-500 text-sm py-2">
            No availability set. Add your available days below.
          </p>
        )}
      </div>

      {/* Add new availability */}
      {addingDay ? (
        <div className="mt-4 p-4 border border-[#2563EB]/30 rounded-[8px] bg-[#2563EB]/5">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select
                value={addingDay}
                onChange={(e) => setAddingDay(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
              >
                {DAYS.filter(
                  (d) => !slots.some((s) => s.day_of_week === d.value)
                ).map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSlot} loading={saving}>
                Save
              </Button>
              <Button variant="secondary" onClick={() => setAddingDay(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : availableDays.length > 0 ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setAddingDay(availableDays[0].value)}>
            + Add Availability
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          All days have availability set. Remove a day to change it.
        </p>
      )}
    </div>
  )
}