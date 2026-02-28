/**
 * Date/time helpers using IST (UTC+5:30)
 * All date strings are in YYYY-MM-DD format (IST)
 */

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5h30m in ms

const toIST = (date = new Date()) => new Date(date.getTime() + IST_OFFSET);

// Returns today's date string in IST (YYYY-MM-DD)
const todayIST = () => {
    const d = toIST();
    return d.toISOString().slice(0, 10);
};

// Returns tomorrow's date string in IST
const tomorrowIST = () => {
    const d = toIST(new Date(Date.now() + 86400000));
    return d.toISOString().slice(0, 10);
};

// Returns yesterday's date string in IST
const yesterdayIST = () => {
    const d = toIST(new Date(Date.now() - 86400000));
    return d.toISOString().slice(0, 10);
};

// Returns n days ago date string in IST
const daysAgoIST = (n) => {
    const d = toIST(new Date(Date.now() - n * 86400000));
    return d.toISOString().slice(0, 10);
};

/**
 * Returns current meal type based on IST hour.
 * Returns null if not in any meal window.
 */
const getCurrentMeal = () => {
    const now = toIST();
    const hour = now.getUTCHours(); // UTC hours of IST date

    const B_START = parseInt(process.env.BREAKFAST_START || 7);
    const B_END = parseInt(process.env.BREAKFAST_END || 10);
    const L_START = parseInt(process.env.LUNCH_START || 12);
    const L_END = parseInt(process.env.LUNCH_END || 16);
    const D_START = parseInt(process.env.DINNER_START || 19);
    const D_END = parseInt(process.env.DINNER_END || 22);

    if (hour >= B_START && hour < B_END) return 'breakfast';
    if (hour >= L_START && hour < L_END) return 'lunch';
    if (hour >= D_START && hour < D_END) return 'dinner';
    return null;
};

/**
 * Preference deadline: students must select by 11:59 PM IST the day before.
 * Deadline check: is it still possible to select for tomorrow?
 */
const canSelectForTomorrow = () => {
    // Always true until midnight IST
    return true; // selection window is always open until midnight
};

// Returns the date range for a calendar query (next 7 days from today)
const getCalendarDates = (days = 7) => {
    const dates = [];
    for (let i = 1; i <= days; i++) {
        const d = toIST(new Date(Date.now() + i * 86400000));
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
};

module.exports = {
    todayIST,
    tomorrowIST,
    yesterdayIST,
    daysAgoIST,
    getCurrentMeal,
    getCalendarDates,
    toIST,
};