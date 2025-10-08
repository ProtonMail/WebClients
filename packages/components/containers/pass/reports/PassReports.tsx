import { useEffect, useRef, useState } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { Pagination } from '@proton/components/components/pagination';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { usePassBridge } from '@proton/pass/lib/bridge/PassBridgeProvider';
import type { MonitorReport, UsageReport } from '@proton/pass/lib/organization/types';
import type { MaybeNull, MemberMonitorReport } from '@proton/pass/types';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { dateLocale } from '@proton/shared/lib/i18n';

import SubSettingsSection from '../../layout/SubSettingsSection';
import { PassReportsMonitorTable } from './PassReportsMonitorTable';
import { PassReportsUsageTable } from './PassReportsUsageTable';

/** BE default and max value is 50 */
const REPORTS_PAGE_SIZE = 50;

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

export const PassReports = () => {
    const { organization } = usePassBridge();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading(true);
    const sectionLoading = useRef<'monitor' | 'usage'>();
    const didLoad = useRef(false);
    const [reports, setReports] = useState<Reports>(new Map());
    const [totalMemberCount, setTotalMemberCount] = useState<number>(0);
    const [monitorPage, setMonitorPage] = useState(1);
    const [usagePage, setUsagePage] = useState(1);

    const monitorReports = intoMonitorReports(reports.get(monitorPage));
    const usageReports = intoUsageReports(reports.get(usagePage));

    const onMonitorSelect = (page: number) => setMonitorPage(page);
    const onMonitorNext = () => setMonitorPage((page) => page + 1);
    const onMonitorPrevious = () => setMonitorPage((page) => page - 1);

    const onUsageSelect = (page: number) => setUsagePage(page);
    const onUsageNext = () => setUsagePage((page) => page + 1);
    const onUsagePrevious = () => setUsagePage((page) => page - 1);

    const handleMonitorDownloadClick = () => {
        const csv = monitorReports.reduce(
            (acc, item) =>
                acc +
                `"${item.primaryEmail}","${item.ReusedPasswords ?? ''}","${item.Inactive2FA ?? ''}","${item.WeakPasswords ?? ''}","${item.ExcludedItems ?? ''}","${item.emailBreachCount}","${formatDate(item.ReportTime)}"\n`,
            `${c('Title').t`User`},${c('Title').t`Reused passwords`},${c('Title').t`Inactive 2FA`},${c('Title').t`Weak passwords`},${c('Title').t`Excluded items`},${c('Title').t`Email breaches`},${c('Title').t`Last updated`}\n`
        );

        const blob = new Blob([csv], { type: 'text/csv' });
        downloadFile(blob, `${PASS_SHORT_APP_NAME}_monitor_reports_${Date.now()}`);
    };

    const handleUsageDownloadClick = () => {
        const csv = usageReports.reduce(
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
        organization.reports.get({ page: page ? page - 1 : undefined }).then((result) => {
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
        withLoading(fetchReports())
            .then(() => (didLoad.current = true))
            .catch(handleError);
    }, []);

    return (
        <SettingsSectionWide customWidth="90em">
            <SubSettingsSection
                id="monitor-report"
                title={c('Title').t`${PASS_SHORT_APP_NAME} Monitor Report`}
                className="container-section-sticky-section"
            >
                <PassReportsMonitorTable
                    reports={monitorReports}
                    loading={!didLoad.current || (loading && sectionLoading.current === 'monitor')}
                />
                <div className="flex justify-space-between mt-4">
                    <Pagination
                        page={monitorPage}
                        total={totalMemberCount ?? 0}
                        limit={REPORTS_PAGE_SIZE}
                        onSelect={onMonitorSelect}
                        onNext={onMonitorNext}
                        onPrevious={onMonitorPrevious}
                    />
                    <Button shape="outline" onClick={handleMonitorDownloadClick} title={c('Action').t`Export as CSV`}>
                        <Icon name="arrow-down-line" className="mr-2" />
                        {c('Action').t`Export as CSV`}
                    </Button>
                </div>
            </SubSettingsSection>
            <SubSettingsSection
                id="usage-report"
                title={c('Title').t`Usage Report`}
                className="container-section-sticky-section"
            >
                <PassReportsUsageTable
                    reports={usageReports}
                    loading={!didLoad.current || (loading && sectionLoading.current === 'usage')}
                />
                <div className="flex justify-space-between mt-4">
                    <Pagination
                        page={usagePage}
                        total={totalMemberCount ?? 0}
                        limit={REPORTS_PAGE_SIZE}
                        onSelect={onUsageSelect}
                        onNext={onUsageNext}
                        onPrevious={onUsagePrevious}
                    />
                    <Button shape="outline" onClick={handleUsageDownloadClick} title={c('Action').t`Export as CSV`}>
                        <Icon name="arrow-down-line" className="mr-2" />
                        {c('Action').t`Export as CSV`}
                    </Button>
                </div>
            </SubSettingsSection>
        </SettingsSectionWide>
    );
};
