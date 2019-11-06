const endOfDay = (date) => {
    const result = new Date(+date);
    result.setUTCHours(23, 59, 59, 999);
    return result;
};

export default endOfDay;
