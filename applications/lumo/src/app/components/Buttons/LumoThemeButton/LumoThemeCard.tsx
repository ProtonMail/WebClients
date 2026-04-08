import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import clsx from '@proton/utils/clsx';

import { MobileSelectors } from '../../../mobileSelectors';

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
            <ButtonLike
                shape="outline"
                color={selected ? 'norm' : 'weak'}
                className={clsx(
                    'p-0 rounded overflow-hidden border-2',
                    MobileSelectors.themeButton,
                    selected && 'pointer-events-none'
                )}
                onClick={() => onChange(value)}
                aria-label={c('Action').t`Use ${label} theme`}
            >
                <img src={src} alt="" className="rtl:mirror" />
            </ButtonLike>
            <span>{label}</span>
        </div>
    );
};

export default LumoThemeCard;
