import { c } from 'ttag';

import type { Revision } from '@proton/drive';

import { ContextMenuButton } from '../../../../statelessComponents/ContextMenu';
import type { RevisionsProviderState } from '../../useRevisionsModalState';

interface Props {
    revision: Revision;
    reportRevisionAbuse: RevisionsProviderState['reportRevisionAbuse'];
    close: () => void;
}

export const RevisionReportAbuseButton = ({ revision, reportRevisionAbuse, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Report abuse`}
            icon="exclamation-circle"
            testId="context-menu-revision-report-abuse"
            action={() => reportRevisionAbuse(revision)}
            close={close}
        />
    );
};
