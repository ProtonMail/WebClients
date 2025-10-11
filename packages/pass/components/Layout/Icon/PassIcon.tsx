import type { FC } from 'react';

import type { IconSize } from '@proton/icons/types';
import { usePassTheme } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PassIconStatus } from '@proton/pass/types/data/pass-icon';

import { getIconSizePx } from './IconBox';

type Props = { status: PassIconStatus; size: IconSize; className?: string };

export const PassIcon: FC<Props> = ({ status, size, className }) => {
    const theme = usePassTheme();

    const icon = (() => {
        if (status === PassIconStatus.LOCKED_DROPDOWN && theme === PassThemeOption.PassLight) return `${status}-light`;
        return status;
    })();

    return (
        <img
            src={`/assets/${icon}.svg`}
            width={getIconSizePx(size)}
            height={getIconSizePx(size)}
            alt=""
            className={className}
        />
    );
};
