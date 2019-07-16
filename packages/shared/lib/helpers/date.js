export const nextYear = (date = new Date()) => {
    const newDate = new Date(date.getTime());
    newDate.setFullYear(date.getFullYear() + 1);
    return newDate;
};

export const previousYear = (date = new Date()) => {
    const newDate = new Date(date.getTime());
    newDate.setFullYear(date.getFullYear() - 1);
    return newDate;
};
