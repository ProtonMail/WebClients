import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

const ViewSelector = ({
    className = 'pm-field w100',
    loading = false,
    disabled = false,
    view,
    onChangeView,
    ...rest
}) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: DAY },
        { text: c('Calendar view').t`Week`, value: WEEK },
        { text: c('Calendar view').t`Month`, value: MONTH },
        { text: c('Calendar view').t`Year`, value: YEAR },
        { text: c('Calendar view').t`Agenda`, value: AGENDA }
    ];

    return (
        <select
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select calendar view`}
            value={view}
            onChange={({ target }) => onChangeView(+target.value)}
            {...rest}
        >
            {options.map(({ text, value }) => {
                return (
                    <option key={value} value={value}>
                        {text}
                    </option>
                );
            })}
        </select>
    );
};

ViewSelector.propTypes = {
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string,
    view: PropTypes.oneOf([DAY, WEEK, MONTH, YEAR, AGENDA]),
    onChangeView: PropTypes.func
};

export default ViewSelector;
