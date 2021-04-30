import React from 'react';
import { ThemeTypes } from 'proton-shared/lib/themes/themes';

import ThemeCard from './ThemeCard';

export interface Theme {
    label: string;
    identifier: ThemeTypes;
    src: string;
}
interface Props {
    themeIdentifier: ThemeTypes;
    liClassName?: string;
    onChange: (themeType: ThemeTypes) => void;
    disabled?: boolean;
    list: Theme[];
}

const ThemeCards = ({ themeIdentifier, onChange, disabled, liClassName, list }: Props) => {
    return (
        <ul className="unstyled m0 flex">
            {list.map(({ identifier, label, src }) => {
                const id = `id_${identifier}`;
                return (
                    <li className={liClassName} key={label}>
                        <ThemeCard
                            label={label}
                            id={id}
                            src={src}
                            selected={themeIdentifier === identifier}
                            onChange={() => onChange(identifier)}
                            disabled={disabled}
                        />
                    </li>
                );
            })}
        </ul>
    );
};

export default ThemeCards;
