import { useState } from 'react';

import { isAfter, isBefore } from 'date-fns';

interface FilterModel {
    start?: Date;
    end?: Date;
}

const useAuthLogsFilter = (initialStartDate = undefined, initialEndDate = undefined) => {
    const [filter, setFilter] = useState<FilterModel>({
        start: initialStartDate,
        end: initialEndDate,
    });

    const handleStartDateChange = (start: Date | undefined) => {
        if (!start) {return;}
        if (!filter.end || isBefore(start, filter.end)) {
            setFilter({ ...filter, start });
        } else {
            setFilter({ ...filter, start, end: start });
        }
    };

    const handleEndDateChange = (end: Date | undefined) => {
        if (!end) {return;}
        if (!filter.start || isAfter(end, filter.start)) {
            setFilter({ ...filter, end });
        } else {
            setFilter({ ...filter, start: end, end });
        }
    };

    return { filter, handleStartDateChange, handleEndDateChange };
};

export default useAuthLogsFilter;
