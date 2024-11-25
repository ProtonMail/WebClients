import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';

import { usePublicShare } from '../../../store';
import { useReportAbuseModal } from '../../modals/ReportAbuseModal/ReportAbuseModal';
import type { LinkInfo } from '../../modals/ReportAbuseModal/types';

export default function ReportAbuseButton({ linkInfo }: { linkInfo: LinkInfo }) {
    const [reportAbuseModal, showReportAbuseModal] = useReportAbuseModal();
    const { submitAbuseReport } = usePublicShare();

    return (
        <>
            <Tooltip title={c('Action').t`Report an issue`}>
                <Button
                    shape="solid"
                    size="medium"
                    color="weak"
                    data-testid="report-abuse-button"
                    className="ml-2 mb-2 fixed left-0 bottom-0"
                    icon
                    onClick={() => showReportAbuseModal({ linkInfo, onSubmit: submitAbuseReport })}
                >
                    <Icon className="color-weak" name="flag-filled" alt={c('Action').t`Report an issue`} />
                </Button>
            </Tooltip>
            {reportAbuseModal}
        </>
    );
}
