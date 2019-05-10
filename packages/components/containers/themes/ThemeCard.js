import React from 'react';
import PropTypes from 'prop-types';
import { RadioCard } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

const ThemeCard = ({ label, id, alt, src, checked, onChange, disabled, customizable, onCustomization, ...rest }) => {
    const handleClick = checked ? onCustomization : noop;

    const customize = customizable ? (
        <>
            <br />
            <span className="link" onClick={handleClick}>
                Customize
            </span>
        </>
    ) : (
        <>
            <br />
            <span className="inbl" />
        </>
    );

    return (
        <RadioCard
            label={label}
            name="themeCard"
            id={id}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            {...rest}
        >
            <img alt={alt} src={src} />
            {customize}
        </RadioCard>
    );
};

ThemeCard.propTypes = {
    label: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    src: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    customizable: PropTypes.bool,
    onChange: PropTypes.func,
    onCustomization: PropTypes.func
};

ThemeCard.defaultProps = {
    customizable: false
};

export default ThemeCard;
