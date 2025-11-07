import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

import './CloseButton.scss';

interface CloseButtonProps {
    onClose: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export const CloseButton = ({ onClose, className, style }: CloseButtonProps) => {
    return (
        <Button
            className={clsx('close-button rounded-full w-custom h-custom shrink-0 p-0 border-none', className)}
            style={{
                '--w-custom': '2.5rem',
                '--h-custom': '2.5rem',
                ...style,
            }}
            aria-label={c('Alt').t`Close`}
            onClick={onClose}
        >
            <IcCross className="color-hint" size={5} />
        </Button>
    );
};
