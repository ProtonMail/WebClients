import React from 'react';
import PropTypes from 'prop-types';
import { Label, Row } from 'react-components';

import FrequencyInput from '../inputs/FrequencyInput';
import CustomFrequencySelector from '../inputs/CustomFrequencySelector';
import { FREQUENCY } from '../../../constants';

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
}) => {
    const { type } = frequencyModel;
    const show = type === FREQUENCY.CUSTOM;

    const handleChangeFrequencyType = (type) => onChange({ ...frequencyModel, type });

    return (
        <Row collapseOnMobile={collapseOnMobile}>
            <Label htmlFor="event-frequency-select">{label}</Label>
            <div className="flex-item-fluid">
                <div>
                    <FrequencyInput
                        className="mb1"
                        id="event-frequency-select"
                        value={type}
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

FrequencyRow.propTypes = {
    label: PropTypes.node,
    frequencyModel: PropTypes.object,
    start: PropTypes.object,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number,
    errors: PropTypes.object,
    isSubmitted: PropTypes.bool,
    onChange: PropTypes.func,
    collapseOnMobile: PropTypes.bool
};

export default FrequencyRow;
