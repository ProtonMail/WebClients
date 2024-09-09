import { c } from 'ttag';

import type { DriveFileRevision } from '../../../store';
import { ContextMenuButton } from '../../sections/ContextMenu';
import type { RevisionsProviderState } from '../RevisionsProvider';

interface Props {
    revision: DriveFileRevision;
    openRevisionPreview: RevisionsProviderState['openRevisionPreview'];
    close: () => void;
}

const RevisionPreviewButton = ({ revision, openRevisionPreview, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Preview`}
            icon="eye"
            testId="context-menu-preview"
            action={() => openRevisionPreview(revision)}
            close={close}
        />
    );
};

export default RevisionPreviewButton;
