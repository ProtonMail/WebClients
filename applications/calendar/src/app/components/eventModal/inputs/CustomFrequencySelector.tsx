import { FREQUENCY } from 'proton-shared/lib/calendar/constants';
import { WeekStartsOn } from 'proton-shared/lib/calendar/interface';
import React from 'react';

import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';
import RepeatEveryRow from '../rows/RepeatEveryRow';
import RepeatOnRow from '../rows/RepeatOnRow';
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
        <div className="frequency-selector w100 flex flex-wrap">
            <RepeatEveryRow
                frequencyModel={frequencyModel}
                start={start}
                onChange={onChange}
                errors={errors}
                isSubmitted={isSubmitted}
            />
            {frequencyModel.frequency === FREQUENCY.WEEKLY && (
                <RepeatOnRow
                    frequencyModel={frequencyModel}
                    start={start}
                    weekStartsOn={weekStartsOn}
                    onChange={onChange}
                />
            )}
            <EndsRow
                frequencyModel={frequencyModel}
                start={start}
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                errors={errors}
                isSubmitted={isSubmitted}
                onChange={onChange}
            />
        </div>
    );
};

export default CustomFrequencySelector;
