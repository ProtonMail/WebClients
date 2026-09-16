import type { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './MeetingSnackbarCard.scss';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    onOpen?: () => void;
    openLabel?: string;
    isOpenTargetFocusable?: boolean;
}

export const MeetingSnackbarCard = ({
    children,
    className,
    onOpen,
    openLabel,
    isOpenTargetFocusable = true,
    ...rest
}: Props) => (
    <div
        className={clsx(
            'meeting-snackbar-card bg-norm border border-norm rounded-xl p-4 overflow-hidden',
            onOpen && 'meeting-snackbar-card--clickable relative',
            className
        )}
        {...rest}
    >
        {onOpen && (
            <button
                type="button"
                className="absolute inset-0 z-0 cursor-pointer border-none bg-transparent"
                onClick={onOpen}
                aria-label={isOpenTargetFocusable ? openLabel : undefined}
                aria-hidden={isOpenTargetFocusable ? undefined : true}
                tabIndex={isOpenTargetFocusable ? undefined : -1}
            />
        )}
        <div
            className={clsx(
                'meeting-snackbar-card__content flex flex-nowrap justify-space-between items-center',
                onOpen && 'relative z-up'
            )}
        >
            {children}
        </div>
    </div>
);
