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
                color="weak"
                className={clsx(
                    'p-0 overflow-hidden border-2',
                    MobileSelectors.themeButton,
                    selected && 'pointer-events-none'
                )}
                style={{
                    // Proton's .button radius outranks the radius utilities. 12 outer − 2 border
                    // leaves a 10 clip, which hides the image's own 8 corners so all four match the ring.
                    borderRadius: 'var(--lumo-radius-12)',
                    ...(selected && { borderColor: 'var(--lumo-control-border-focus)' }),
                }}
                onClick={() => onChange(value)}
                aria-label={c('Action').t`Use ${label} theme`}
            >
                <img src={src} alt="" className="block w-full rtl:mirror" />
            </ButtonLike>
            <span>{label}</span>
        </div>
    );
};

export default LumoThemeCard;
