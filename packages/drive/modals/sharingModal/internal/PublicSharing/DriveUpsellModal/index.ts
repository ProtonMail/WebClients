import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../../../../internal/withHoc';
import { DriveUpsellModalView, type DriveUpsellModalViewProps } from './DriveUpsellModalView';
import { type UseDriveUpsellModalStateProps, useDriveUpsellModalState } from './useDriveUpsellModalState';

const DriveUpsellModal = withHoc<UseDriveUpsellModalStateProps, DriveUpsellModalViewProps>(
    useDriveUpsellModalState,
    DriveUpsellModalView
);

export const useDriveUpsellModal = () => {
    const [driveUpsellModal, showDriveUpsellModal] = useModalTwoStatic(DriveUpsellModal);
    return { driveUpsellModal, showDriveUpsellModal };
};
