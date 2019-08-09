import React from 'react';
import PropTypes from 'prop-types';

import { classnames } from '../../helpers/component';

const Radio = ({ id, children, className, ...rest }) => {
    return (
        <label htmlFor={id} className={classnames(['inline-flex', className])}>
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
