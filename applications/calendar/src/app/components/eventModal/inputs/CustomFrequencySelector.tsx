import { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';

import EndsRow from '../rows/EndsRow';
import RepeatEveryRow from '../rows/RepeatEveryRow';

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
