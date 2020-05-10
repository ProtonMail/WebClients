const MILLISECONDS_IN_WEEK = 604800000;

const getWeekNumber = (date: Date) => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const startOfYear = new Date(0);
    startOfYear.setUTCFullYear(start.getUTCFullYear());

    const diff = Math.max(start.getTime() - startOfYear.getTime(), 0);
    const result = Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
    return result > 52 ? 1 : result;
};

export default getWeekNumber;
