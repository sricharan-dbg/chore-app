import { addDays, addWeeks, addMonths, parseISO, format, isBefore, isAfter, startOfDay } from 'date-fns'

export const RECURRENCE_TYPES = [
  { value: 'none',    label: 'One-time' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'biweekly',label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom',  label: 'Custom days' },
]

export const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

/**
 * Given a chore with recurrence settings, return all occurrence dates
 * within [rangeStart, rangeEnd].
 */
export function getOccurrences(chore, rangeStart, rangeEnd) {
  const base = parseISO(chore.due_date)
  const type = chore.recurrence_type || 'none'

  if (type === 'none') {
    const d = startOfDay(base)
    if (!isBefore(d, startOfDay(rangeStart)) && !isAfter(d, startOfDay(rangeEnd))) {
      return [format(d, 'yyyy-MM-dd')]
    }
    return []
  }

  const dates = []
  let cursor = startOfDay(base)
  const end = startOfDay(rangeEnd)
  const start = startOfDay(rangeStart)
  const maxIter = 500

  for (let i = 0; i < maxIter && !isAfter(cursor, end); i++) {
    if (!isBefore(cursor, start)) {
      dates.push(format(cursor, 'yyyy-MM-dd'))
    }
    switch (type) {
      case 'daily':    cursor = addDays(cursor, 1); break
      case 'weekly':   cursor = addWeeks(cursor, 1); break
      case 'biweekly': cursor = addWeeks(cursor, 2); break
      case 'monthly':  cursor = addMonths(cursor, 1); break
      case 'custom': {
        // custom_days: array of weekday indices [0-6]
        const days = chore.custom_days || []
        if (!days.length) { cursor = addDays(cursor, 1); break }
        // advance to next matching weekday
        let next = addDays(cursor, 1)
        for (let j = 0; j < 7; j++) {
          if (days.includes(next.getDay())) break
          next = addDays(next, 1)
        }
        cursor = next
        break
      }
      default: cursor = addDays(cursor, 1)
    }
  }
  return dates
}
