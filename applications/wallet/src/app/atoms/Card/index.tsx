import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import clsx from '@proton/utils/clsx';

import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';

import './Card.scss';

export type CardType = 'info' | 'error';

type ClassesMap = { [key in CardType]: string };

const classesMap: ClassesMap = {
    info: 'wallet-card--info',
    error: 'wallet-card--error',
};

interface CardProps {
    type?: CardType;
    children?: ReactNode;
    onClose?: () => void;
}

const Card = ({ type = 'info', children, onClose }: CardProps) => {
    const { isNarrow } = useResponsiveContainerContext();

    return (
        <div
            className={clsx(
                'flex flex-row items-center flex-nowrap w-full wallet-card rounded-2xl gap-3',
                classesMap[type]
            )}
        >
            {!isNarrow && <IcExclamationCircleFilled size={7} className="color-danger w-1/5" />}
            <div className="grow">
                <div className={clsx('flex flex-column w-full')}>
                    <div className={clsx('w-full flex')}>{children}</div>
                </div>
            </div>
            {onClose && (
                <Button icon shape="ghost" size="medium" className="shrink-0 rounded-full" onClick={onClose}>
                    <IcCross className="modal-close-icon" alt={c('Action').t`Close`} />
                </Button>
            )}
        </div>
    );
};

export default Card;
