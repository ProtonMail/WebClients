import { useAppTitle } from '@proton/components';

import type { DriveSectionRouteProps } from '../../components/sections/Drive/DriveView';
import { useLinkName } from '../../store/_views/utils';

export const useFolderContainerTitle = (params: DriveSectionRouteProps) => {
    const name = useLinkName(params.shareId || '', params.linkId || '');
    useAppTitle(name);
};
