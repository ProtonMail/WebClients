import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import Icon from '../icon/Icon';
import { classnames } from '../../helpers/component';

const Checkbox = ({
    id,
    className,
    loading,
    disabled,
    checked,
    indeterminate = false,
    color,
    backgroundColor,
    children,
    ...rest
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <label htmlFor={id} className={classnames(['inline-flex', className])}>
            <input
                ref={inputRef}
                disabled={disabled || loading}
                id={id}
                type="checkbox"
                className="pm-checkbox"
                checked={checked}
                {...rest}
            />
            <span className="pm-checkbox-fakecheck" style={{ background: backgroundColor, color }}>
                <Icon className={classnames(['pm-checkbox-fakecheck-img', color && 'fill-currentColor'])} name="on" />
            </span>
            {children}
        </label>
    );
};

Checkbox.propTypes = {
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    backgroundColor: PropTypes.string,
    color: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    checked: PropTypes.bool.isRequired,
    indeterminate: PropTypes.bool,
    children: PropTypes.node
};

export default Checkbox;
