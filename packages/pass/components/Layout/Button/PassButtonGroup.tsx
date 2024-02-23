import type { FC, PropsWithChildren } from 'react';

import { ButtonGroup } from '@proton/components/components';
import type { Size } from '@proton/components/components/button/ButtonGroup';
import clsx from '@proton/utils/clsx';

import './PassButtonGroup.scss';

type Props = {
    className?: string;
    size?: Size;
};

export const PassButtonGroup: FC<PropsWithChildren<Props>> = ({ children, className, size }) => {
    return (
        <ButtonGroup
            className={clsx('pass-button-group w-full', className)}
            color="weak"
            pill
            shape="solid"
            size={size}
        >
            {children}
        </ButtonGroup>
    );
};
