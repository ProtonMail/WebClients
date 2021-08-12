import { c } from 'ttag';

import { SidebarList } from '@proton/components';
import DriveSidebarListItem from './DriveSidebarListItem';
import FileRecoveryIcon from '../../FilesRecoveryModal/FileRecoveryIcon';

interface Props {
    shareId?: string;
}

const DriveSidebarList = ({ shareId }: Props) => (
    <SidebarList>
        <DriveSidebarListItem to="/" icon="inbox" shareId={shareId}>
            <>
                {c('Link').t`My files`}
                <FileRecoveryIcon className="ml0-5" />
            </>
        </DriveSidebarListItem>
        <DriveSidebarListItem to="/shared-urls" icon="link" shareId={shareId}>
            {c('Link').t`Shared`}
        </DriveSidebarListItem>
        <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId}>
            {c('Link').t`Trash`}
        </DriveSidebarListItem>
    </SidebarList>
);

export default DriveSidebarList;
