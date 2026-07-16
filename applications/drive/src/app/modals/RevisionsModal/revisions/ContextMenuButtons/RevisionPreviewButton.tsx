import { c } from 'ttag';

import type { Revision } from '@proton/drive';
import { IcEye } from '@proton/icons/icons/IcEye';

import { ContextMenuButton } from '../../../../statelessComponents/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    openRevisionPreview: RevisionsProviderState['openRevisionPreview'];
    close: () => void;
}

export const RevisionPreviewButton = ({ revision, openRevisionPreview, close }: Props) => {
    const title = c('Action').t`Preview`;
    return (
        <ContextMenuButton
            name={title}
            icon={<IcEye />}
            testId="context-menu-preview"
            action={() => openRevisionPreview(revision)}
            close={close}
        />
    );
};
