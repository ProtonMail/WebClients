import React from 'react';

import { FREQUENCY } from '../../../constants';
import RepeatEveryRow from '../rows/RepeatEveryRow';
import RepeatOnRow from '../rows/RepeatOnRow';
import EndsRow from '../rows/EndsRow';
import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';
import { WeekStartsOn } from '../../../containers/calendar/interface';

interface Props {
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    displayWeekNumbers: boolean;
    weekStartsOn: WeekStartsOn;
    errors: object;
    isSubmitted: boolean;
    onChange: (value: FrequencyModel) => void;
    collapseOnMobile?: boolean;
}
const CustomFrequencySelector = ({
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    onChange,
    isSubmitted,
    collapseOnMobile
}: Props) => {
    return (
        <div className="w100">
            <RepeatEveryRow
                frequencyModel={frequencyModel}
                start={start}
                onChange={onChange}
                errors={errors}
                isSubmitted={isSubmitted}
                collapseOnMobile={collapseOnMobile}
            />
            {frequencyModel.frequency === FREQUENCY.WEEKLY && (
                <RepeatOnRow
                    frequencyModel={frequencyModel}
                    start={start}
                    weekStartsOn={weekStartsOn}
                    onChange={onChange}
                    collapseOnMobile={collapseOnMobile}
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
                collapseOnMobile={collapseOnMobile}
            />
        </div>
    );
};

export default CustomFrequencySelector;
