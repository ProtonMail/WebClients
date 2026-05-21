import type { ModalStateProps } from '@proton/components';

import { withHoc } from '../../legacy/hooks/withHoc';
import { DriveOnboardingModalView, type DriveOnboardingModalViewProps } from './DriveOnboardingModalView';
import { useDriveOnboardingModalState } from './useDriveOnboardingModalState';

export const DriveOnboardingModal = withHoc<ModalStateProps, DriveOnboardingModalViewProps>(
    useDriveOnboardingModalState,
    DriveOnboardingModalView
);
