import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Tooltip } from '@proton/components';

import { usePublicShare } from '../../../store';
import { useReportAbuseModal } from '../../modals/ReportAbuseModal/ReportAbuseModal';
import { LinkInfo } from '../../modals/ReportAbuseModal/types';

interface Props {
    linkInfo: LinkInfo;
    reportCallback: () => void;
    comment?: string;
    className?: string;
}

export default function ReportVirusButton({ linkInfo, comment, className, reportCallback }: Props) {
    const [reportAbuseModal, showReportAbuseModal] = useReportAbuseModal();
    const { submitAbuseReport } = usePublicShare();

    const handleClick = () => {
        return showReportAbuseModal({
            linkInfo,
            onSubmit: submitAbuseReport,
            onClose: reportCallback,
            prefilled: {
                Category: 'malware',
                Comment: comment,
            },
        });
    };

    return (
        <>
            <Tooltip title={c('Action').t`Report an issue`}>
                <Button
                    shape="outline"
                    color="norm"
                    data-testid="report-abuse-button"
                    style={{ '--min-w-custom': '6rem' }}
                    className={className}
                    onClick={handleClick}
                >
                    {c('Info').t`Report link`}
                </Button>
            </Tooltip>
            {reportAbuseModal}
        </>
    );
}
