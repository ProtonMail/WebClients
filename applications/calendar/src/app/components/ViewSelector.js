import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';
import { c } from 'ttag';

import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA, CUSTOM } = VIEWS;

const ViewSelector = ({ isNarrow, range, loading = false, disabled = false, view, onChange, ...rest }) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: DAY },
        { text: c('Calendar view').t`Week`, value: WEEK },
        { text: c('Calendar view').t`Month`, value: MONTH }
        // { text: c('Calendar view').t`Year`, value: YEAR },
        // { text: c('Calendar view').t`Agenda`, value: AGENDA },
    ];

    if (isNarrow) {
        return (
            <select
                disabled={loading || disabled}
                className="toolbar-select"
                title={c('Action').t`Select calendar view`}
                value={range ? CUSTOM : view}
                onChange={({ target }) => onChange(+target.value)}
                {...rest}
            >
                {[...options, range && { text: c('Calendar view').t`Custom`, value: CUSTOM }]
                    .filter(Boolean)
                    .map(({ text, value }) => {
                        return (
                            <option key={value} value={value}>
                                {text}
                            </option>
                        );
                    })}
            </select>
        );
    }

    return (
        <>
            {options.map(({ text, value }) => {
                const v = range ? CUSTOM : value;
                return (
                    <button
                        key={value}
                        type="button"
                        disabled={loading || disabled}
                        className={classnames(['toolbar-button color-currentColor', v === view && 'is-active'])}
                        aria-pressed={v === view ? true : undefined}
                        onClick={() => onChange(value)}
                    >
                        <span className="mauto">{text}</span>
                    </button>
                );
            })}
        </>
    );
};

ViewSelector.propTypes = {
    disabled: PropTypes.bool,
    isNarrow: PropTypes.bool,
    loading: PropTypes.bool,
    range: PropTypes.number,
    view: PropTypes.oneOf([DAY, WEEK, MONTH, YEAR, AGENDA]),
    onChange: PropTypes.func
};

export default ViewSelector;
