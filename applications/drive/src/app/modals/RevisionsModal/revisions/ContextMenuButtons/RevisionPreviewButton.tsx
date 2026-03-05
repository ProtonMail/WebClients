import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../../../components/sections/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    openRevisionPreview: RevisionsProviderState['openRevisionPreview'];
    close: () => void;
}

export const RevisionPreviewButton = ({ revision, openRevisionPreview, close }: Props) => {
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
