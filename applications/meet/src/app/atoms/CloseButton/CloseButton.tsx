import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcCross } from '@proton/icons';
import clsx from '@proton/utils/clsx';

interface CloseButtonProps {
    onClose: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export const CloseButton = ({ onClose, className, style }: CloseButtonProps) => {
    return (
        <Button
            className={clsx('close-button rounded-full w-custom h-custom shrink-0 p-0', className)}
            style={{
                '--w-custom': '2.5rem',
                '--h-custom': '2.5rem',
                ...style,
            }}
            aria-label={c('Alt').t`Close`}
            onClick={onClose}
            shape="ghost"
        >
            <IcCross className="color-hint" size={5} />
        </Button>
    );
};
