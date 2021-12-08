import { useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { c } from 'ttag';

import { SidebarList } from '@proton/components';

import { ShareWithKey } from '../../../store';
import { DriveSectionRouteProps } from '../../sections/Drive/DriveView';
import DriveSidebarListItem from './DriveSidebarListItem';
import DriveSidebarFolders from './DriveSidebarFolders/DriveSidebarFolders';

interface Props {
    shareId?: string;
    userShares: ShareWithKey[];
}

const DriveSidebarList = ({ shareId, userShares }: Props) => {
    const match = useRouteMatch<DriveSectionRouteProps>();

    const [sidebarWidth, setSidebarWidth] = useState('100%');
    const setSidebarLevel = (level: number) => {
        const extraWidth = Math.floor(level / 7) * 50;
        setSidebarWidth(`${100 + extraWidth}%`);
    };

    return (
        <SidebarList style={{ width: sidebarWidth, maxWidth: sidebarWidth }}>
            {userShares.map((useShare) => (
                <DriveSidebarFolders
                    key={useShare.shareId}
                    path={match.url}
                    shareId={useShare.shareId}
                    linkId={useShare.rootLinkId}
                    setSidebarLevel={setSidebarLevel}
                />
            ))}
            <DriveSidebarListItem
                to="/shared-urls"
                icon="link"
                shareId={shareId}
                isActive={match.url === '/shared-urls'}
            >
                <span className="text-ellipsis" title={c('Link').t`Shared`}>{c('Link').t`Shared`}</span>
            </DriveSidebarListItem>
            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} isActive={match.url === '/trash'}>
                <span className="text-ellipsis" title={c('Link').t`Trash`}>{c('Link').t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};

export default DriveSidebarList;
