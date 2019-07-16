export const copyDate = (date) => new Date(date.getTime());

export const setMonth = (date, month) => {
    const newDate = copyDate(date);
    newDate.setMonth(month);
    return newDate;
};

export const setDay = (date, day) => {
    const newDate = copyDate(date);
    newDate.setDate(day);
    return newDate;
};

export const setYear = (date, year) => {
    const newDate = copyDate(date);
    newDate.setFullYear(year);
    return newDate;
};

export const nextYear = (date = new Date()) => setYear(date, date.getFullYear() + 1);
export const previousYear = (date = new Date()) => setYear(date, date.getFullYear() - 1);
