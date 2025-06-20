import { Toast as LivekitToast } from '@livekit/components-react';

import clsx from '@proton/utils/clsx';

interface ToastProps {
    children: React.ReactNode;
    fadeOut?: boolean;
}

export const Toast = ({ children, fadeOut = false }: ToastProps) => {
    return (
        <LivekitToast
            className={clsx(
                'bg-norm border border-strong color-norm p-4 rounded-lg shadow-lg w-custom h-custom flex items-center justify-start',
                fadeOut && 'animate-fade-out'
            )}
            style={{ '--w-custom': '16rem', '--h-custom': '5rem' }}
        >
            {children}
        </LivekitToast>
    );
};
