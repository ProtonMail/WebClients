import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import React from 'react';

import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';
import RepeatEveryRow from '../rows/RepeatEveryRow';
import EndsRow from '../rows/EndsRow';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: object;
    isSubmitted: boolean;
    onChange: (value: FrequencyModel) => void;
}
const CustomFrequencySelector = ({
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    onChange,
    isSubmitted,
}: Props) => {
    return (
        <>
            <RepeatEveryRow
                frequencyModel={frequencyModel}
                start={start}
                weekStartsOn={weekStartsOn}
                onChange={onChange}
                errors={errors}
                isSubmitted={isSubmitted}
            />
            <EndsRow
                frequencyModel={frequencyModel}
                start={start}
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                errors={errors}
                isSubmitted={isSubmitted}
                onChange={onChange}
            />
        </>
    );
};

export default CustomFrequencySelector;
