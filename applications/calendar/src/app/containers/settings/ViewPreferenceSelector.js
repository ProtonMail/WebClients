import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { SETTINGS_VIEW } from '../../constants';

const { DAY, WEEK, MONTH, YEAR, PLANNING } = SETTINGS_VIEW;

const ViewPreferenceSelector = ({ className = 'pm-field w100', loading = false, disabled = false, view, onChange, ...rest }) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: DAY },
        { text: c('Calendar view').t`Week`, value: WEEK },
        { text: c('Calendar view').t`Month`, value: MONTH },
        { text: c('Calendar view').t`Year`, value: YEAR },
        { text: c('Calendar view').t`Agenda`, value: PLANNING },
    ].filter(Boolean);

    return (
        <select
            disabled={loading || disabled}
            className={className}
            title={c('Action').t`Select calendar view`}
            value={view}
            onChange={({ target }) => onChange(+target.value)}
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

ViewPreferenceSelector.propTypes = {
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string,
    view: PropTypes.oneOf([DAY, WEEK, MONTH, YEAR, PLANNING]),
    onChange: PropTypes.func
};

export default ViewPreferenceSelector;
