import type { ModalStateProps } from '@proton/components';

import { withHoc } from '../modalUtils/withHoc';
import { DriveOnboardingModalView, type DriveOnboardingModalViewProps } from './DriveOnboardingModalView';
import { useDriveOnboardingModalState } from './useDriveOnboardingModalState';

export const DriveOnboardingModal = withHoc<ModalStateProps, DriveOnboardingModalViewProps>(
    useDriveOnboardingModalState,
    DriveOnboardingModalView
);
