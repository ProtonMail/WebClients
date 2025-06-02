import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../sections/ContextMenu';
import type { RevisionsProviderState } from '../RevisionsProvider';

interface Props {
    revision: Revision;
    downloadRevision: RevisionsProviderState['downloadRevision'];
    close: () => void;
}

const RevisionDownloadButton = ({ revision, downloadRevision, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Download`}
            icon="arrow-down-line"
            testId="context-menu-download"
            action={() => downloadRevision(revision)}
            close={close}
        />
    );
};

export default RevisionDownloadButton;
