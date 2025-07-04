export const getMinMaxDate = () => {
    const minDate = new Date();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    return { min: minDate, max: maxDate };
};
