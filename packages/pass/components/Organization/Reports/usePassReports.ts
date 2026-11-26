import { useEffect, useRef, useState } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { dateLocale } from '@proton/shared/lib/i18n';

import { usePassBridge } from '../../../lib/bridge/PassBridgeProvider';
import type { MonitorReport, UsageReport } from '../../../lib/organization/types';
import type { MemberMonitorReport } from '../../../types/api/pass';
import type { MaybeNull } from '../../../types/utils';

/** BE default and max value is 50 */
export const REPORTS_PAGE_SIZE = 50;

const intoMonitorReports = (reports?: MemberMonitorReport[]): MonitorReport[] => {
    if (!reports) {
        return [];
    }

    return reports.map((memberReport) => ({
        primaryEmail: memberReport.PrimaryEmail,
        emailBreachCount:
            memberReport.AddressBreachCount.TotalBreachCount + memberReport.CustomEmailBreachCount.TotalBreachCount,
        ...memberReport.MonitorReport,
    }));
};

const intoUsageReports = (reports?: MemberMonitorReport[]): UsageReport[] => {
    if (!reports) {
        return [];
    }

    return reports.map((report) => ({
        primaryEmail: report.PrimaryEmail,
        lastActivityTime: report.LastActivityTime,
        ...report.ItemsReport,
    }));
};

const formatDate = (epoch?: MaybeNull<number>) => (epoch ? format(epoch * 1_000, 'PPp', { locale: dateLocale }) : '');

type Page = number;
type Reports = Map<Page, MemberMonitorReport[]>;

/** Both reports read the same paginated endpoint, so they share one cache of pages. */
export const usePassReports = (upgradeRequired: boolean) => {
    const { organization } = usePassBridge();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading(!upgradeRequired);
    const [exportingMonitor, withExportingMonitor] = useLoading();
    const [exportingUsage, withExportingUsage] = useLoading();
    const sectionLoading = useRef<'monitor' | 'usage'>(undefined);
    const didLoad = useRef(false);
    const [reports, setReports] = useState<Reports>(new Map());
    const [totalMemberCount, setTotalMemberCount] = useState<number>(0);
    const [monitorPage, setMonitorPage] = useState(1);
    const [usagePage, setUsagePage] = useState(1);

    /** Fetches every member report across all pages, not just the current one */
    const fetchAllReports = async (): Promise<MemberMonitorReport[]> => {
        // Fetch the first page to learn the total, then fetch any remaining pages.
        const first = await organization.reports.get({ page: 0, pageSize: REPORTS_PAGE_SIZE });
        const pageCount = Math.ceil(first.TotalMemberCount / REPORTS_PAGE_SIZE);

        const all = [...first.MemberReports];
        for (let page = 1; page < pageCount; page++) {
            const result = await organization.reports.get({ page, pageSize: REPORTS_PAGE_SIZE });
            all.push(...result.MemberReports);
        }

        return all;
    };

    const handleMonitorDownloadClick = async () => {
        const csv = intoMonitorReports(await fetchAllReports()).reduce(
            (acc, item) =>
                acc +
                `"${item.primaryEmail}","${item.ReusedPasswords ?? ''}","${item.Inactive2FA ?? ''}","${item.WeakPasswords ?? ''}","${item.ExcludedItems ?? ''}","${item.emailBreachCount}","${formatDate(item.ReportTime)}"\n`,
            `${c('Title').t`User`},${c('Title').t`Reused passwords`},${c('Title').t`Inactive 2FA`},${c('Title').t`Weak passwords`},${c('Title').t`Excluded items`},${c('Title').t`Email breaches`},${c('Title').t`Last updated`}\n`
        );

        const blob = new Blob([csv], { type: 'text/csv' });
        downloadFile(blob, `${PASS_SHORT_APP_NAME}_monitor_reports_${Date.now()}`);
    };

    const handleUsageDownloadClick = async () => {
        const csv = intoUsageReports(await fetchAllReports()).reduce(
            (acc, item) =>
                acc +
                `"${item.primaryEmail}","${item.OwnedItemCount}","${item.AccessibleItemCount}","${item.OwnedVaultCount}","${item.AccessibleVaultCount}","${formatDate(item.lastActivityTime)}"\n`,
            `${c('Title').t`User`},${c('Title').t`Items owned`},${c('Title').t`Accessible items`},${c('Title').t`Vaults owned`},${c('Title').t`Accessible vaults`},${c('Title').t`Last activity`}\n`
        );

        const blob = new Blob([csv], { type: 'text/csv' });
        downloadFile(blob, `${PASS_SHORT_APP_NAME}_usage_reports_${Date.now()}`);
    };

    const fetchReports = (page?: number) =>
        // BE pagination starts at 0 while our page state starts at 1
        organization.reports.get({ page: page ? page - 1 : undefined, pageSize: REPORTS_PAGE_SIZE }).then((result) => {
            setReports((reports) => reports.set(page ?? 1, result.MemberReports));
            setTotalMemberCount(result.TotalMemberCount);
        });

    useEffect(() => {
        if (didLoad.current) {
            sectionLoading.current = 'monitor';
            if (!reports.has(monitorPage)) {
                withLoading(fetchReports(monitorPage)).catch(handleError);
            }
        }
    }, [monitorPage]);

    useEffect(() => {
        if (didLoad.current) {
            sectionLoading.current = 'usage';
            if (!reports.has(usagePage)) {
                withLoading(fetchReports(usagePage)).catch(handleError);
            }
        }
    }, [usagePage]);

    useEffect(() => {
        // to not show the red banner "business plan is required"
        if (upgradeRequired) {
            didLoad.current = true;
            return;
        }
        withLoading(fetchReports())
            .then(() => (didLoad.current = true))
            .catch(handleError);
    }, []);

    return {
        totalMemberCount,
        monitor: {
            page: monitorPage,
            setPage: setMonitorPage,
            reports: intoMonitorReports(reports.get(monitorPage)),
            loading: !didLoad.current || (loading && sectionLoading.current === 'monitor'),
            exporting: exportingMonitor,
            onExport: () => withExportingMonitor(handleMonitorDownloadClick()).catch(handleError),
        },
        usage: {
            page: usagePage,
            setPage: setUsagePage,
            reports: intoUsageReports(reports.get(usagePage)),
            loading: !didLoad.current || (loading && sectionLoading.current === 'usage'),
            exporting: exportingUsage,
            onExport: () => withExportingUsage(handleUsageDownloadClick()).catch(handleError),
        },
    };
};

export type PassReportsState = ReturnType<typeof usePassReports>;
