const MILLISECONDS_IN_WEEK = 604800000;

const getWeekNumber = (date) => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const startOfYear = new Date(0);
    startOfYear.setFullYear(start.getUTCFullYear());

    const diff = Math.max(start.getTime() - startOfYear.getTime(), 0);
    return Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
};

export default getWeekNumber;
