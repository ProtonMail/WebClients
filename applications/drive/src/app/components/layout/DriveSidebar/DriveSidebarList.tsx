import { useRouteMatch } from 'react-router-dom';
import { c } from 'ttag';

import { SidebarList } from '@proton/components';
import { ShareMetaShort } from '@proton/shared/lib/interfaces/drive/share';

import DriveSidebarListItem from './DriveSidebarListItem';
import FileRecoveryIcon from '../../ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import { DriveSectionRouteProps } from '../../sections/Drive/DriveView';

interface Props {
    shareId?: string;
    userShares: ShareMetaShort[];
}

const DriveSidebarList = ({ shareId, userShares }: Props) => {
    const match = useRouteMatch<DriveSectionRouteProps>();

    return (
        <SidebarList>
            {userShares.map((useShare) => (
                <DriveSidebarListItem
                    key={useShare.ShareID}
                    to={`/${useShare.ShareID}/folder/${useShare.LinkID}`}
                    icon="inbox"
                    shareId={shareId}
                    isActive={useShare.ShareID === match.params.shareId}
                >
                    {c('Link').t`My files`}
                    <FileRecoveryIcon className="ml0-5" />
                </DriveSidebarListItem>
            ))}
            <DriveSidebarListItem
                to="/shared-urls"
                icon="link"
                shareId={shareId}
                isActive={match.path === '/shared-urls'}
            >
                {c('Link').t`Shared`}
            </DriveSidebarListItem>
            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} isActive={match.path === '/trash'}>
                {c('Link').t`Trash`}
            </DriveSidebarListItem>
        </SidebarList>
    );
};

export default DriveSidebarList;
