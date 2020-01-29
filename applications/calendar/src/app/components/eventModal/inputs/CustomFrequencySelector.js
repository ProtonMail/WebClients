import React from 'react';
import PropTypes from 'prop-types';

import { FREQUENCY } from '../../../constants';
import RepeatEveryRow from '../rows/RepeatEveryRow';
import RepeatOnRow from '../rows/RepeatOnRow';
import EndsRow from '../rows/EndsRow';

const CustomFrequencySelector = ({
    frequencyModel,
    start,
    displayWeekNumbers,
    weekStartsOn,
    errors,
    onChange,
    isSubmitted,
    collapseOnMobile
}) => {
    return (
        <div className="w100">
            <RepeatEveryRow frequencyModel={frequencyModel} onChange={onChange} collapseOnMobile={collapseOnMobile} />
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

CustomFrequencySelector.propTypes = {
    frequencyModel: PropTypes.object,
    start: PropTypes.object,
    displayWeekNumbers: PropTypes.bool,
    weekStartsOn: PropTypes.number,
    errors: PropTypes.object,
    isSubmitted: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    collapseOnMobile: PropTypes.bool
};

export default CustomFrequencySelector;
