import React from 'react';
import PropTypes from 'prop-types';
import { Block } from '../../components';
import ThemeCard from './ThemeCard';

const ThemeCards = ({ themeIdentifier, onChange, onCustomization, loading, list }) => {
    return (
        <Block className="flex">
            {list.map(({ identifier, label, id, alt, src, customizable }) => {
                return (
                    <ThemeCard
                        key={id}
                        label={label}
                        id={id}
                        alt={alt}
                        src={src}
                        checked={themeIdentifier === identifier}
                        onChange={() => onChange(identifier)}
                        disabled={loading}
                        customizable={customizable}
                        onCustomization={onCustomization}
                    />
                );
            })}
        </Block>
    );
};

ThemeCards.propTypes = {
    themeIdentifier: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onCustomization: PropTypes.func,
    loading: PropTypes.bool,
    list: PropTypes.array.isRequired,
};

export default ThemeCards;
