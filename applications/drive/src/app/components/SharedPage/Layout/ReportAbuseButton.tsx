import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, useModals } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { usePublicShare } from '../../../store';
import ReportAbuseModal from '../../ReportAbuseModal/ReportAbuseModal';
import { LinkInfo } from '../../ReportAbuseModal/types';

interface Props {
    linkInfo: LinkInfo;
    className?: string;
}

export default function ReportAbuseButton({ linkInfo, className }: Props) {
    const { createModal } = useModals();
    const { submitAbuseReport } = usePublicShare();

    return (
        <Button
            shape="ghost"
            size="small"
            color="weak"
            data-test-id="report-abuse-button"
            className={clsx('flex flex-align-items-center', className)}
            onClick={() => createModal(<ReportAbuseModal linkInfo={linkInfo} onSubmit={submitAbuseReport} />)}
        >
            <span className="color-weak">
                <Icon size={16} name="exclamation-circle-filled" className="mr0-5" />
                <span>{c('Label').t`Report`}</span>
            </span>
        </Button>
    );
}
