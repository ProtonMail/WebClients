import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Info } from '@proton/components/index';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import './PassThemeCard.scss';

type Props = {
    theme: PassThemeOption;
    selected: boolean;
    onChange: (theme: PassThemeOption) => void;
    imageSrc: string;
    label: string;
};

export const PassThemeCard: FC<Props> = ({ theme, selected, onChange, imageSrc, label }) => (
    <div className="flex flex-nowrap flex-column gap-1 items-center">
        <Button
            className={clsx('pass-theme-card-button rounded', selected && 'is-active pointer-events-none')}
            onClick={() => onChange(theme)}
            aria-label={c('Action').t`Use ${label} theme`}
        >
            <img src={imageSrc} alt="" />
        </Button>
        <div className="flex flex-nowrap gap-1 items-center">
            {label && <span className={clsx(!selected && 'color-weak', selected && 'text-bold')}>{label}</span>}
            {theme === PassThemeOption.OS && (
                <Info
                    className="color-weak"
                    questionMark
                    title={c('Info').t`${PASS_APP_NAME} will follow your system theme.`}
                />
            )}
        </div>
    </div>
);
