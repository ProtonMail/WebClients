import { useModalTwoStatic } from '@proton/components';

import { withHoc } from '../../hooks/withHoc';
import { ReportAbuseModalView, type ReportAbuseModalViewProps } from './ReportAbuseModalView';
import { AbuseCategoryType, type AbuseReportPrefill } from './types';
import { type UseReportAbuseModalProps, useReportAbuseModalState } from './useReportAbuseModalState';

export { AbuseCategoryType };
export type { AbuseReportPrefill };

export const ReportAbuseModal = withHoc<UseReportAbuseModalProps, ReportAbuseModalViewProps>(
    useReportAbuseModalState,
    ReportAbuseModalView
);

export const useReportAbuseModal = () => {
    const [reportAbuseModal, showReportAbuseModal] = useModalTwoStatic(ReportAbuseModal);

    return [reportAbuseModal, showReportAbuseModal] as const;
};
