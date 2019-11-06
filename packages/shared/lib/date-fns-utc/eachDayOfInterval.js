const eachDayOfInterval = (start, end) => {
    const endTime = end.getTime();

    if (!(start.getTime() <= endTime)) {
        throw new RangeError('Invalid interval');
    }

    const dates = [];

    const currentDate = new Date(start);
    currentDate.setUTCHours(0, 0, 0, 0);

    const step = 1;
    while (currentDate.getTime() <= endTime) {
        dates.push(new Date(currentDate));
        currentDate.setUTCDate(currentDate.getUTCDate() + step);
        currentDate.setUTCHours(0, 0, 0, 0);
    }
    return dates;
};

export default eachDayOfInterval;
