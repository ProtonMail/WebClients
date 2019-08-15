import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';
import { c } from 'ttag';

import { VIEWS } from '../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;

const ViewSelector = ({ view, updateView }) => {
    const options = [
        { text: c('Calendar view').t`Day`, value: DAY },
        { text: c('Calendar view').t`Week`, value: WEEK },
        { text: c('Calendar view').t`Month`, value: MONTH },
        { text: c('Calendar view').t`Year`, value: YEAR },
        { text: c('Calendar view').t`Agenda`, value: AGENDA }
    ];

    const handleChangeSelect = ({ target }) => updateView(target.value);

    return (
        <>
            <select
                className="toolbar-select nodesktop"
                title={c('Action').t`Select calendar view`}
                value={view}
                onChange={handleChangeSelect}
            >
                {options.map(({ text, ...rest }, index) => (
                    <option key={index.toString()} {...rest}>
                        {text}
                    </option>
                ))}
            </select>
            <div className="nomobile notablet">
                {options.map(({ text, value }) => {
                    return (
                        <button
                            type="button"
                            key={value}
                            className={classnames(['toolbar-button', value === view && 'is-active'])}
                            role="button"
                            onClick={() => updateView(value)}
                        >
                            {text}
                        </button>
                    );
                })}
            </div>
        </>
    );
};

ViewSelector.propTypes = {
    view: PropTypes.oneOf([DAY, WEEK, MONTH, YEAR, AGENDA]),
    updateView: PropTypes.func
};

export default ViewSelector;
