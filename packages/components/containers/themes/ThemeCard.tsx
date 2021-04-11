import React from 'react';

import { RadioCard } from '../../components';

interface Props {
    label: string;
    id: string;
    src: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

const ThemeCard = ({ label, id, src, checked, onChange, disabled }: Props) => {
    return (
        <RadioCard label={label} name="themeCard" id={id} checked={checked} onChange={onChange} disabled={disabled}>
            <img alt="" src={src} />
        </RadioCard>
    );
};

export default ThemeCard;
