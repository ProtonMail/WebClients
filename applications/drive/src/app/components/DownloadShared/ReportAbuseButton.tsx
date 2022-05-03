import React from 'react';
import { c } from 'ttag';
import { InlineLinkButton, useModals } from '@proton/components';

import ReportAbuseModal from '../ReportAbuseModal/ReportAbuseModal';
import usePublicSharing, { SharedURLInfoDecrypted } from '../../hooks/drive/usePublicSharing';

interface Props {
    linkInfo: SharedURLInfoDecrypted;
    password: string;
}

export default function ReportAbuseButton({ linkInfo, password }: Props) {
    const { createModal } = useModals();
    const { submitAbuseReport } = usePublicSharing();

    return (
        <InlineLinkButton
            data-test-id="report-abuse-button"
            onClick={() =>
                createModal(<ReportAbuseModal linkInfo={linkInfo} onSubmit={submitAbuseReport} password={password} />)
            }
        >
            {c('Label').t`Report Abuse`}
        </InlineLinkButton>
    );
}
