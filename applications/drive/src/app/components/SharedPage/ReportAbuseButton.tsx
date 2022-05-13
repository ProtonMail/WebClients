import React from 'react';
import { c } from 'ttag';
import { InlineLinkButton, useModals } from '@proton/components';

import { usePublicShare } from '../../store';
import ReportAbuseModal from '../ReportAbuseModal/ReportAbuseModal';
import { LinkInfo } from '../ReportAbuseModal/types';

interface Props {
    linkInfo: LinkInfo;
}

export default function ReportAbuseButton({ linkInfo }: Props) {
    const { createModal } = useModals();
    const { submitAbuseReport } = usePublicShare();

    return (
        <InlineLinkButton
            data-test-id="report-abuse-button"
            onClick={() => createModal(<ReportAbuseModal linkInfo={linkInfo} onSubmit={submitAbuseReport} />)}
        >
            {c('Label').t`Report Abuse`}
        </InlineLinkButton>
    );
}
