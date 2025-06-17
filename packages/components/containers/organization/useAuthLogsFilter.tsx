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
        setFilter((prev) => {
            if (!start) {
                return { ...prev, start: undefined };
            }

            if (!prev.end || isBefore(start, prev.end)) {
                return { ...prev, start };
            } else {
                return { ...prev, start, end: start };
            }
        });
    };

    const handleEndDateChange = (end: Date | undefined) => {
        setFilter((prev) => {
            if (!end) {
                return { ...prev, end: undefined };
            }

            if (!prev.start || isAfter(end, prev.start)) {
                return { ...prev, end };
            } else {
                return { ...prev, start: end, end };
            }
        });
    };

    return { filter, handleStartDateChange, handleEndDateChange };
};

export default useAuthLogsFilter;
