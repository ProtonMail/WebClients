const startOfDay = (date: Date) => {
    const result = new Date(+date);
    result.setUTCHours(0, 0, 0, 0);
    return result;
};

export default startOfDay;
