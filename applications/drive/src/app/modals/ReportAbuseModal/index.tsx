import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../modalUtils/withHoc';
import { ReportAbuseModalView, type ReportAbuseModalViewProps } from './ReportAbuseModalView';
import type { AbuseReportPrefill } from './types';
import { type UseReportAbuseModalProps, useReportAbuseModalState } from './useReportAbuseModalState';

export { AbuseCategory } from '@proton/drive';
export type { AbuseReportPrefill };

export const ReportAbuseModal = withHoc<UseReportAbuseModalProps, ReportAbuseModalViewProps>(
    useReportAbuseModalState,
    ReportAbuseModalView
);

export const useReportAbuseModal = () => {
    const [reportAbuseModal, showReportAbuseModal] = useModalTwoStatic(ReportAbuseModal);

    return { reportAbuseModal, showReportAbuseModal };
};
