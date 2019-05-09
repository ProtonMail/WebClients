import React from 'react';
import PropTypes from 'prop-types';
import { ThemeCard, Block } from 'react-components';

const ThemeCards = ({ themeId, onChange, onCustomization, loading, list }) => {
    return (
        <Block className="flex">
            {list.map(({ label, id, alt, src, customizable }) => {
                return (
                    <ThemeCard
                        key={id}
                        label={label}
                        id={id}
                        alt={alt}
                        src={src}
                        checked={themeId === id}
                        onChange={() => onChange(id)}
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
    themeId: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    onCustomization: PropTypes.func,
    loading: PropTypes.bool,
    list: PropTypes.array.isRequired
};

export default ThemeCards;
