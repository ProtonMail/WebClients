const differenceInCalendarYears = (left: Date, right: Date) => {
    return left.getUTCFullYear() - right.getUTCFullYear();
};

export default differenceInCalendarYears;
