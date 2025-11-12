/**
 * Formats a date in WhatsApp-style format Returns empty string for today, "Yesterday" for yesterday, day name for dates
 * within the last week, and full date for older dates
 */
export function formatWhatsAppStyle(dateKey: string): string {
  if (dateKey === 'unknown') return 'Unknown Date';

  try {
    // Helper to get YYYY-MM-DD from a Date object in local time
    const getLocalYYYYMMDD = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const localTodayKey = getLocalYYYYMMDD(today);

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const localYesterdayKey = getLocalYYYYMMDD(yesterday);

    if (dateKey === localTodayKey) {
      // Don't show header for today
      return '';
    } else if (dateKey === localYesterdayKey) {
      return 'Yesterday';
    } else {
      const msgDate = new Date(dateKey + 'T00:00:00');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      if (msgDate > sevenDaysAgo) {
        // Show day name for dates within the last week
        const daysOfWeek = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        return daysOfWeek[msgDate.getDay()];
      } else {
        // For older messages (sevenDaysAgo or older), show full date
        return msgDate.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'DateKey:', dateKey);
    return 'Invalid Date';
  }
}

/**
 * Creates a timestamp string in ISO format with local timezone offset Format: YYYY-MM-DDThh:mm:ss.mmmZ±hh:mm Example:
 * 2025-05-27T22:23:39.849+05:30
 */
export function createLocalTimestamp(date?: Date): string {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  // Get timezone offset in hours and minutes
  const offset = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offset) / 60);
  const offsetMinutes = Math.abs(offset) % 60;
  const offsetSign = offset >= 0 ? '+' : '-';

  // Format the timestamp
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetSign}${String(
    offsetHours,
  ).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
}

export const formatTime = (timestamp: string | Date): string => {
  try {
    const date = new Date(timestamp);
    //
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Handle midnight
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  } catch {
    return '';
  }
};
