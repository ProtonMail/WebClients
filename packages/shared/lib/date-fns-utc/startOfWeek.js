const startOfWeek = (date, options) => {
    const weekStartsOn = !options || typeof options.weekStartsOn === 'undefined' ? 0 : options.weekStartsOn;

    const result = new Date(+date);
    const day = result.getUTCDay();
    const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

    result.setUTCDate(date.getUTCDate() - diff);
    result.setUTCHours(0, 0, 0, 0);
    return result;
};

export default startOfWeek;
