import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

interface CloseButtonProps {
    onClose: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export const CloseButton = ({ onClose, className, style }: CloseButtonProps) => {
    return (
        <Button
            className={clsx('close-button rounded-full w-custom h-custom shrink-0 p-0 border-weak', className)}
            style={{
                '--w-custom': '2.5rem',
                '--h-custom': '2.5rem',
                ...style,
            }}
            shape="outline"
            aria-label={c('Alt').t`Close`}
            onClick={onClose}
        >
            <IcCross size={5} alt={c('Action').t`Close`} />
        </Button>
    );
};
