import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

export type LumoThemeCardProps = {
    src: string;
    label: string;
    value: string | number;
};

type Props = LumoThemeCardProps & {
    selected: boolean;
    onChange: (value: string | number) => void;
};

const LumoThemeCard = ({ src, label, selected, onChange, value }: Props) => {
    return (
        <div className="flex flex-nowrap flex-column gap-1 items-center">
            <Button
                className={clsx('lumo-theme-card-button rounded', selected && 'is-active pointer-events-none')}
                onClick={() => onChange(value)}
                aria-label={c('Action').t`Use ${label} theme`}
            >
                <img src={src} alt="" />
            </Button>
            <span>{label}</span>
        </div>
    );
};

export default LumoThemeCard;
