import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../../../components/sections/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    downloadRevision: RevisionsProviderState['downloadRevision'];
    close: () => void;
}

export const RevisionDownloadButton = ({ revision, downloadRevision, close }: Props) => {
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
