import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../../../components/sections/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    openRevisionDetails: RevisionsProviderState['openRevisionDetails'];

    close: () => void;
}

export const RevisionDetailsButton = ({ revision, openRevisionDetails, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="info-circle"
            testId="context-menu-details"
            action={() => openRevisionDetails(revision)}
            close={close}
        />
    );
};
