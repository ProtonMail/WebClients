import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import type { DateTimeModel, FrequencyModel } from '@proton/shared/lib/interfaces/calendar';

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
    displayStacked?: boolean;
    setTemporaryValues: (value: FrequencyModel) => void;
}
const CustomFrequencySelector = ({
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    onChange,
    isSubmitted,
    displayStacked = false,
    setTemporaryValues,
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
                displayStacked={displayStacked}
            />
            <hr className="my-4" />
            <EndsRow
                frequencyModel={frequencyModel}
                start={start}
                displayWeekNumbers={displayWeekNumbers}
                weekStartsOn={weekStartsOn}
                errors={errors}
                isSubmitted={isSubmitted}
                onChange={onChange}
                setTemporaryValues={setTemporaryValues}
            />
        </>
    );
};

export default CustomFrequencySelector;
