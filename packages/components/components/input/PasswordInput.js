import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

import { generateUID } from '../../helpers/component';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

const PasswordInput = (props) => {
    const [type, setType] = useState('password');

    const toggle = () => {
        setType(type === 'password' ? 'text' : 'password');
    };

    const { className, disabled, error, ...rest } = props;
    const { handlers, statusClasses, status } = useInput(props);
    const [uid] = useState(generateUID('passwordInput'));

    return (
        <>
            <span className="relative">
                <input
                    className={`pm-field w100 ${className} ${statusClasses}`}
                    aria-invalid={error && status.isDirty}
                    aria-describedby={uid}
                    type={type}
                    disabled={disabled}
                    {...rest}
                    {...handlers}
                />
                <button
                    title={type === 'password' ? c('Label').t`Reveal password` : c('Label').t`Hide password`}
                    className="password-revealer inline-flex"
                    disabled={disabled}
                    type="button"
                    onClick={toggle}
                >
                    <Icon name={type === 'password' ? 'read' : 'unread'} />
                </button>
            </span>
            <ErrorZone id={uid}>{error && status.isDirty ? error : ''}</ErrorZone>
        </>
    );
};

PasswordInput.propTypes = {
    className: PropTypes.string,
    error: PropTypes.string,
    disabled: PropTypes.bool
};

export default PasswordInput;
