import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import { TranslucentModal } from '../../../components/TranslucentModal/TranslucentModal';

import '../CTAModal.scss';

type CTAModalShellProps = {
    open: boolean;
    onClose: () => void;
    icon: ReactNode;
    title: ReactNode;
    subtitle: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    titleClassName?: string;
    headerClassName?: string;
};

export const CTAModalShell = ({
    open,
    onClose,
    icon,
    title,
    subtitle,
    actions,
    footer,
    titleClassName,
    headerClassName,
}: CTAModalShellProps) => (
    <TranslucentModal open={open} onClose={onClose}>
        <div
            className={clsx('flex flex-column justify-end items-center text-center pt-10 pb-10 w-full')}
            style={{ '--max-w-custom': '32.75rem' }}
        >
            {icon}
            <div className={clsx('flex flex-column gap-2 pb-10 max-w-custom', headerClassName)}>
                <div className={clsx('cta-modal-title color-norm', titleClassName)}>{title}</div>
                <div className="cta-modal-subtitle color-weak">{subtitle}</div>
            </div>
            {actions && (
                <div className="flex flex-column gap-2 items-center cta-modal-content-container w-full max-w-custom">
                    {actions}
                </div>
            )}
            {footer}
        </div>
    </TranslucentModal>
);
