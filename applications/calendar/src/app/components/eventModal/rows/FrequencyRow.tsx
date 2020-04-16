import React from 'react';
import { Label, Row } from 'react-components';

import FrequencyInput from '../inputs/FrequencyInput';
import CustomFrequencySelector from '../inputs/CustomFrequencySelector';
import { FREQUENCY } from '../../../constants';
import { DateTimeModel, FrequencyModel } from '../../../interfaces/EventModel';

interface Props {
    label: React.ReactNode;
    frequencyModel: FrequencyModel;
    start: DateTimeModel;
    displayWeekNumbers: boolean;
    weekStartsOn: number;
    errors: object;
    isSubmitted: boolean;
    onChange: (model: FrequencyModel) => void;
    collapseOnMobile?: boolean;
}

const FrequencyRow = ({
    label,
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    isSubmitted,
    onChange,
    collapseOnMobile
}: Props) => {
    const show = frequencyModel.type === FREQUENCY.CUSTOM;

    const handleChangeFrequencyType = (type: FREQUENCY) => onChange({ ...frequencyModel, type });

    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor="event-frequency-select">{label}</Label>
            <div className="flex-item-fluid">
                <div>
                    <FrequencyInput
                        className="mb1"
                        id="event-frequency-select"
                        data-test-id="event-modal/frequency:select"
                        value={frequencyModel.type}
                        onChange={handleChangeFrequencyType}
                    />
                    {show && (
                        <div className="flex flex-nowrap flex-item-fluid">
                            <CustomFrequencySelector
                                frequencyModel={frequencyModel}
                                start={start}
                                displayWeekNumbers={displayWeekNumbers}
                                weekStartsOn={weekStartsOn}
                                errors={errors}
                                isSubmitted={isSubmitted}
                                onChange={onChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Row>
    );
};

export default FrequencyRow;
