import { c } from 'ttag';

import type { Revision } from '@proton/drive';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';

import { ContextMenuButton } from '../../../../statelessComponents/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    reportRevisionAbuse: RevisionsProviderState['reportRevisionAbuse'];
    close: () => void;
}

export const RevisionReportAbuseButton = ({ revision, reportRevisionAbuse, close }: Props) => {
    const title = c('Action').t`Report abuse`;
    return (
        <ContextMenuButton
            name={title}
            icon={<IcExclamationCircle />}
            testId="context-menu-revision-report-abuse"
            action={() => reportRevisionAbuse(revision)}
            close={close}
        />
    );
};
