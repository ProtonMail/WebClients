import { c } from 'ttag';

import type { Revision } from '@proton/drive';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import { ContextMenuButton } from '../../../../statelessComponents/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    openRevisionDetails: RevisionsProviderState['openRevisionDetails'];

    close: () => void;
}

export const RevisionDetailsButton = ({ revision, openRevisionDetails, close }: Props) => {
    const title = c('Action').t`Details`;
    return (
        <ContextMenuButton
            name={title}
            icon={<IcInfoCircle />}
            testId="context-menu-details"
            action={() => openRevisionDetails(revision)}
            close={close}
        />
    );
};
