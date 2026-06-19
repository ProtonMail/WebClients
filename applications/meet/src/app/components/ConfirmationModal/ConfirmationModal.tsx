import { useContext } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { ModalContext } from '@proton/components/components/modalTwo/Modal';
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
    primaryLoading?: boolean;
    secondaryText?: string;
    onSecondaryAction?: () => void;
    secondaryButtonClass?: MeetButtonClass;
    onClose?: () => void;
    /** Forwarded to ModalTwo. See its `enableFocusTrap`. */
    enableFocusTrap?: boolean;
}

// Rendered inside <ModalTwo> to read its generated `id` from context, wiring the title/message to
// the dialog's aria-labelledby/aria-describedby for a proper accessible name and description.
const ConfirmationModalContent = ({
    icon,
    title,
    message,
    primaryText,
    primaryButtonClass = 'primary',
    primaryLoading = false,
    onPrimaryAction,
    secondaryText,
    secondaryButtonClass = 'tertiary',
    onSecondaryAction,
    onClose,
}: ConfirmationModalProps) => {
    const { id } = useContext(ModalContext);

    return (
        <>
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
                className="flex flex-column flex-nowrap justify-end items-center gap-4 text-center h-full p-6 pt-custom overflow-hidden min-h-custom"
                style={{
                    '--pt-custom': '3rem',
                    '--min-h-custom': '22rem',
                }}
            >
                {icon}
                <div id={id} className="text-3xl text-semibold">
                    {title}
                </div>
                {message && (
                    <div id={`${id}-description`} className="color-weak">
                        {message}
                    </div>
                )}

                <div className="w-full flex flex-column flex-nowrap gap-2 mt-4">
                    <Button
                        className={clsx(
                            'rounded-full text-semibold',
                            primaryButtonClass,
                            primaryLoading && primaryButtonClass === 'danger' && 'confirmation-modal-danger-loading'
                        )}
                        onClick={onPrimaryAction}
                        disabled={primaryLoading}
                        loading={primaryLoading}
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
        </>
    );
};

export const ConfirmationModal = ({ onClose, enableFocusTrap, ...rest }: ConfirmationModalProps) => {
    return (
        <ModalTwo
            open={true}
            onClose={onClose}
            enableFocusTrap={enableFocusTrap}
            rootClassName="confirmation-modal"
            size="small"
            className="large-meet-radius border border-norm overflow-y-auto"
        >
            <ConfirmationModalContent onClose={onClose} {...rest} />
        </ModalTwo>
    );
};
