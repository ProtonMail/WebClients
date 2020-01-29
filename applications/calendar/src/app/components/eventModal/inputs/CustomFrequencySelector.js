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
    error,
    onChange,
    isSubmitted,
    collapseOnMobile
}) => {
    return (
        <div>
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
                error={error}
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
    error: PropTypes.string,
    isSubmitted: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    collapseOnMobile: PropTypes.bool
};

export default CustomFrequencySelector;
