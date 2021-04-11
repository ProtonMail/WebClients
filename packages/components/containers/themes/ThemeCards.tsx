import React from 'react';
import { ThemeTypes } from 'proton-shared/lib/themes/themes';

import { Block } from '../../components';
import ThemeCard from './ThemeCard';

interface Theme {
    label: string;
    identifier: ThemeTypes;
    src: string;
}

interface Props {
    themeIdentifier: ThemeTypes;
    onChange: (themeType: ThemeTypes) => void;
    disabled?: boolean;
    list: Theme[];
}

const ThemeCards = ({ themeIdentifier, onChange, disabled, list }: Props) => {
    return (
        <Block className="flex">
            {list.map(({ identifier, label, src }) => {
                const id = `id_${identifier}`;
                return (
                    <ThemeCard
                        key={label}
                        label={label}
                        id={id}
                        src={src}
                        checked={themeIdentifier === identifier}
                        onChange={() => onChange(identifier)}
                        disabled={disabled}
                    />
                );
            })}
        </Block>
    );
};

export default ThemeCards;
