import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

import type { MeetButtonClass } from '../../types';

import './ConfirmationModal.scss';

interface ConfirmationModalProps {
    icon?: React.ReactNode;
    title: string | React.ReactNode;
    message?: string | React.ReactNode;
    primaryText: string;
    onPrimaryAction: () => void;
    primaryButtonClass?: MeetButtonClass;
    secondaryText?: string;
    onSecondaryAction?: () => void;
    secondaryButtonClass?: MeetButtonClass;
    onClose?: () => void;
}

export const ConfirmationModal = ({
    icon,
    title,
    message,
    primaryText,
    primaryButtonClass = 'primary',
    onPrimaryAction,
    secondaryText,
    secondaryButtonClass = 'tertiary',
    onSecondaryAction,
    onClose,
}: ConfirmationModalProps) => {
    return (
        <ModalTwo
            open={true}
            rootClassName="confirmation-modal"
            size="small"
            className="large-meet-radius border border-norm"
        >
            {onClose && (
                <Button
                    onClick={onClose}
                    className="absolute top-custom right-custom rounded-full w-custom h-custom shrink-0 p-0 border-none"
                    style={{
                        '--top-custom': '1.5rem',
                        '--right-custom': '1.5rem',
                    }}
                    shape="ghost"
                    size="small"
                >
                    <IcCross className="color-hint" size={5} alt={c('Action').t`Close`} />
                </Button>
            )}
            <div
                className="flex flex-column justify-end items-center gap-4 text-center h-full p-6 pt-custom overflow-hidden"
                style={{ '--pt-custom': '5rem' }}
            >
                {icon}
                <div className="text-3xl text-semibold">{title}</div>
                {message && <div className="color-weak">{message}</div>}

                <div className="w-full flex flex-column gap-2 mt-4">
                    <Button
                        className={clsx('rounded-full text-semibold', primaryButtonClass)}
                        onClick={onPrimaryAction}
                        size="large"
                    >
                        {primaryText}
                    </Button>

                    {onSecondaryAction && (
                        <Button
                            className={clsx('rounded-full text-semibold', secondaryButtonClass)}
                            onClick={onSecondaryAction}
                            size="large"
                        >
                            {secondaryText || c('Action').t`Cancel`}
                        </Button>
                    )}
                </div>
            </div>
        </ModalTwo>
    );
};
