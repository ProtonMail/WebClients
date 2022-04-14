import { DriveSectionRouteProps } from '../../components/sections/Drive/DriveView';
import { useLinkName } from '../../store/_views/utils';

export const useFolderContainerTitle = ({
    params,
    setAppTitle,
}: {
    params: DriveSectionRouteProps;
    setAppTitle: (title?: string) => void;
}) => {
    const name = useLinkName(params.shareId || '', params.linkId || '');
    setAppTitle(name);
};
