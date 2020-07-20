import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const Radio = ({ id, children, className = 'inline-flex', ...rest }) => {
    return (
        <label
            htmlFor={id}
            className={classnames([!className?.includes('increase-surface-click') && 'relative', className])}
        >
            <input id={id} type="radio" className="pm-radio" {...rest} />
            <span className="pm-radio-fakeradio" />
            {children}
        </label>
    );
};

Radio.propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    children: PropTypes.node
};

export default Radio;
