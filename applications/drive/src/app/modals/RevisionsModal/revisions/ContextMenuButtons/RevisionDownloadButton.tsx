import { c } from 'ttag';

import type { Revision } from '@proton/drive';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';

import { ContextMenuButton } from '../../../../statelessComponents/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    downloadRevision: RevisionsProviderState['downloadRevision'];
    close: () => void;
}

export const RevisionDownloadButton = ({ revision, downloadRevision, close }: Props) => {
    const title = c('Action').t`Download`;
    return (
        <ContextMenuButton
            name={title}
            icon={<IcArrowDownLine />}
            testId="context-menu-download"
            action={() => downloadRevision(revision)}
            close={close}
        />
    );
};
