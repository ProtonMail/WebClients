import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import clsx from '@proton/utils/clsx';

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
            <Button
                shape="ghost"
                size="small"
                color="weak"
                data-test-id="report-abuse-button"
                className={clsx('flex flex-align-items-center', className)}
                onClick={() => showReportAbuseModal({ linkInfo, onSubmit: submitAbuseReport })}
            >
                <span className="color-weak">
                    <Icon size={16} name="exclamation-circle-filled" className="mr0-5" />
                    <span>{c('Label').t`Report`}</span>
                </span>
            </Button>
            {reportAbuseModal}
        </>
    );
}
