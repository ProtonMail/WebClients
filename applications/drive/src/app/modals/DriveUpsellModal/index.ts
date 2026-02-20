import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { DriveUpsellModalView, type DriveUpsellModalViewProps } from './DriveUpsellModalView';
import {
    type DriveUpsellModalProps,
    type UseDriveUpsellModalStateProps,
    useDriveUpsellModalState,
} from './useDriveUpsellModalState';

export type { DriveUpsellModalProps };

const DriveUpsellModal = withHoc<UseDriveUpsellModalStateProps, DriveUpsellModalViewProps>(
    useDriveUpsellModalState,
    DriveUpsellModalView
);

export const useDriveUpsellModal = () => {
    const [driveUpsellModal, showDriveUpsellModal] = useModalTwoStatic(DriveUpsellModal);
    return { driveUpsellModal, showDriveUpsellModal };
};
