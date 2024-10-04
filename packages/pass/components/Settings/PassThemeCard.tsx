import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Info } from '@proton/components';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import './PassThemeCard.scss';

export type PassThemeCardProps = {
    theme: PassThemeOption;
    src: string;
    label: string;
    info?: ReactNode;
};

type Props = PassThemeCardProps & {
    selected: boolean;
    onChange: (theme: PassThemeOption) => void;
};

export const PassThemeCard: FC<Props> = ({ theme, selected, onChange, src, label }) => (
    <div className="flex flex-nowrap flex-column gap-1 items-center">
        <Button
            className={clsx('pass-theme-card-button rounded', selected && 'is-active pointer-events-none')}
            onClick={() => onChange(theme)}
            aria-label={c('Action').t`Use ${label} theme`}
        >
            <img src={src} alt="" />
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
