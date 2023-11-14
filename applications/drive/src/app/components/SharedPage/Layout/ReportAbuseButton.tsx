import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip, useModalTwo } from '@proton/components';

import { usePublicShare } from '../../../store';
import ReportAbuseModal from '../../modals/ReportAbuseModal/ReportAbuseModal';
import { LinkInfo } from '../../modals/ReportAbuseModal/types';

interface Props {
    linkInfo: LinkInfo;
    className?: string;
}

export default function ReportAbuseButton({ linkInfo, className }: Props) {
    const [reportAbuseModal, showReportAbuseModal] = useModalTwo(ReportAbuseModal);
    const { submitAbuseReport } = usePublicShare();

    return (
        <>
            <Tooltip title={c('Action').t`Report an issue`}>
                <Button
                    shape="solid"
                    size="medium"
                    color="weak"
                    data-testid="report-abuse-button"
                    className={className}
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
