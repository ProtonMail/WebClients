import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import clsx from '@proton/utils/clsx';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';

interface BackgroundBlurInitializingOverlayProps {
    viewSize?: 'xsmall' | 'small' | 'medium' | 'large' | 'midLarge';
}

export const BackgroundBlurInitializingOverlay = ({ viewSize = 'large' }: BackgroundBlurInitializingOverlayProps) => {
    const { isBackgroundBlurInitializing, isBackgroundBlurInitializationFailed } = useMediaManagementContext();

    if (!isBackgroundBlurInitializing && !isBackgroundBlurInitializationFailed) {
        return null;
    }

    const textClassName = clsx(viewSize !== 'large' && 'text-sm');

    return (
        <div
            className="absolute top-0 left-0 w-full h-full flex flex-column items-center justify-center gap-3 z-up color-norm text-center px-4"
            role={isBackgroundBlurInitializationFailed ? 'alert' : 'status'}
            aria-live={isBackgroundBlurInitializationFailed ? 'assertive' : 'polite'}
        >
            {isBackgroundBlurInitializationFailed ? (
                <>
                    <IcExclamationCircleFilled
                        aria-hidden="true"
                        className="color-danger w-custom h-custom"
                        style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                    />
                    <span className={textClassName}>
                        {c('Error')
                            .t`Background blur initialization failed. Please toggle your camera or background blur again`}
                    </span>
                </>
            ) : (
                <>
                    <CircleLoader
                        aria-hidden="true"
                        className="color-primary w-custom h-custom"
                        style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                    />
                    <span className={textClassName}>{c('Info').t`Background blur initializing`}</span>
                </>
            )}
        </div>
    );
};
