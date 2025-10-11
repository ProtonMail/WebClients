import type { FC, PropsWithChildren } from 'react';

import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import clsx from '@proton/utils/clsx';

import './ButtonBar.scss';

type Props = { className?: string; size?: ButtonLikeSize };

export const ButtonBar: FC<PropsWithChildren<Props>> = ({ children, className, size }) => (
    <ButtonGroup className={clsx('pass-button-bar w-full', className)} color="weak" pill shape="solid" size={size}>
        {children}
    </ButtonGroup>
);
