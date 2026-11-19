import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import './CloseButton.scss';

interface CloseButtonProps {
    onClose: () => void;
    className?: string;
    style?: React.CSSProperties;
    tabIndex?: number;
    iconSize?: IconSize;
}

export const CloseButton = ({ onClose, className, style, tabIndex, iconSize = 6 }: CloseButtonProps) => {
    return (
        <Button
            className={clsx('close-button rounded-full w-custom h-custom shrink-0 p-0', className)}
            style={{
                '--w-custom': '2.5rem',
                '--h-custom': '2.5rem',
                ...style,
            }}
            shape="ghost"
            aria-label={c('Alt').t`Close`}
            onClick={onClose}
            tabIndex={tabIndex}
        >
            <IcCross size={iconSize} alt={c('Action').t`Close`} />
        </Button>
    );
};
