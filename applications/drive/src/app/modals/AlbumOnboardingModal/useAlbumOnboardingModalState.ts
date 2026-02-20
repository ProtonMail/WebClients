import { useEffect } from 'react';

import type { ModalProps } from '@proton/components';

import useDriveNavigation from '../../hooks/drive/useNavigate';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import type { AlbumOnboardingModalViewProps } from './AlbumOnboardingModalView';

export const useAlbumOnboardingModalState = ({ onClose, ...props }: ModalProps): AlbumOnboardingModalViewProps => {
    const { navigateToPhotos } = useDriveNavigation();

    useEffect(() => {
        void countActionWithTelemetry(Actions.OnboardingAlbumShown);
    }, []);

    const onTryItNow = () => {
        navigateToPhotos();
        onClose?.();
        void countActionWithTelemetry(Actions.OnboardingAlbumPrimaryAction);
    };

    return {
        ...props,
        onClose,
        onTryItNow,
    };
};
