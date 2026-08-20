import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import clsx from '@proton/utils/clsx';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { InitializingBackgroundEffect } from '../../contexts/MediaManagementProvider/useBackgroundEffectInitializationState';

interface BackgroundEffectInitializingOverlayProps {
    viewSize?: 'xsmall' | 'small' | 'medium' | 'large' | 'midLarge';
}

const getInitializingText = (effect: InitializingBackgroundEffect) =>
    effect === 'blur' ? c('Info').t`Background blur initializing` : c('Info').t`Virtual background initializing`;

const getFailureText = (effect: InitializingBackgroundEffect) =>
    effect === 'blur'
        ? c('Error').t`Background blur initialization failed. Please toggle your camera or background blur again`
        : c('Error').t`Virtual background initialization failed. Please toggle your camera or pick a background again`;

export const BackgroundEffectInitializingOverlay = ({
    viewSize = 'large',
}: BackgroundEffectInitializingOverlayProps) => {
    const { initializingBackgroundEffect, failedBackgroundEffect } = useMediaManagementContext();

    if (!initializingBackgroundEffect && !failedBackgroundEffect) {
        return null;
    }

    const textClassName = clsx(viewSize !== 'large' && 'text-sm');

    return (
        <div
            className="absolute top-0 left-0 w-full h-full flex flex-column items-center justify-center gap-3 z-up color-norm text-center px-4"
            role={failedBackgroundEffect ? 'alert' : 'status'}
            aria-live={failedBackgroundEffect ? 'assertive' : 'polite'}
        >
            {failedBackgroundEffect ? (
                <>
                    <IcExclamationCircleFilled
                        aria-hidden="true"
                        className="color-danger w-custom h-custom"
                        style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                    />
                    <span className={textClassName}>{getFailureText(failedBackgroundEffect)}</span>
                </>
            ) : (
                <>
                    <CircleLoader
                        aria-hidden="true"
                        className="color-primary w-custom h-custom"
                        style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                    />
                    <span className={textClassName}>
                        {initializingBackgroundEffect && getInitializingText(initializingBackgroundEffect)}
                    </span>
                </>
            )}
        </div>
    );
};
