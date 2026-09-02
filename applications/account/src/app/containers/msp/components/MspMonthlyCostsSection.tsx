import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useApi } from '@proton/app-context/useApi';
import {
    DropdownActions,
    IllustrationPlaceholder,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    useErrorHandler,
    usePaginationAsync,
} from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionExtraWide from '@proton/components/containers/account/SettingsSectionExtraWide';
import { downloadEvents } from '@proton/components/containers/b2bDashboard/VPN/helpers';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import {
    type MspCsvReportType,
    getMspBillingPeriods,
    getMspBillingSummary,
    getMspCsvReport,
    getMspDailyUsage,
} from '@proton/shared/lib/api/msp';
import { getFormattedMonths } from '@proton/shared/lib/date/date';
import type {
    MspBillingPeriod,
    MspBillingPeriodsResponse,
    MspBillingSummary,
    MspDailyUsage,
} from '@proton/shared/lib/interfaces/Msp';
import emptyRecordsImg from '@proton/styles/assets/img/illustrations/empty-records.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { MonthlyRow, SeatDay } from '../types';
import LicensesUsageChart from './LicensesUsageChart';

import './MspCompaniesSection.scss';
import './MspMonthlyCostsSection.scss';

const PAGE_SIZE = 15;

const MONTHS_SHORT = getFormattedMonths('MMM');

const billingPeriod = ({ month, year }: Pick<MonthlyRow, 'month' | 'year'>): string =>
    `${MONTHS_SHORT[month]}, ${year}`;

// `BillingPeriod`/`Period` from the API are formatted as "YYYY-MM".
const formatApiBillingPeriod = (apiBillingPeriod: string): string => {
    const [year, month] = apiBillingPeriod.split('-').map(Number);
    return billingPeriod({ month: month - 1, year });
};

const MspMonthlyCostsSection = () => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [organization] = useOrganization();
    const mspId = organization?.ID;
    const [subscription] = useSubscription();
    const currency = subscription?.Currency;
    const isMspCostsTableEnabled = useFlag('MspCostsTableEnabled');

    const [billingSummary, setBillingSummary] = useState<MspBillingSummary>();
    const [billingSummaryLoading, setBillingSummaryLoading] = useState(true);

    const [dailyUsage, setDailyUsage] = useState<MspDailyUsage>();
    const [dailyUsageLoading, setDailyUsageLoading] = useState(true);

    const [billingPeriods, setBillingPeriods] = useState<MspBillingPeriodsResponse>();
    const [billingPeriodsLoading, setBillingPeriodsLoading] = useState(true);
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync();

    useEffect(() => {
        if (!mspId) {
            return;
        }
        void api<MspBillingSummary>(getMspBillingSummary(mspId))
            .then(setBillingSummary)
            .finally(() => setBillingSummaryLoading(false));
    }, [mspId]);

    useEffect(() => {
        if (!isMspCostsTableEnabled) {
            setDailyUsageLoading(false);
            return;
        }
        if (!mspId) {
            return;
        }
        void api<MspDailyUsage>(getMspDailyUsage(mspId))
            .then(setDailyUsage)
            .catch(noop)
            .finally(() => setDailyUsageLoading(false));
    }, [mspId, isMspCostsTableEnabled]);

    useEffect(() => {
        if (!isMspCostsTableEnabled) {
            setBillingPeriodsLoading(false);
            return;
        }
        if (!mspId) {
            return;
        }
        void api<MspBillingPeriodsResponse>(getMspBillingPeriods(mspId, { Page: page - 1, PageSize: PAGE_SIZE }))
            .then(setBillingPeriods)
            .catch(noop)
            .finally(() => setBillingPeriodsLoading(false));
    }, [mspId, isMspCostsTableEnabled, page]);

    if (!currency || billingSummaryLoading || dailyUsageLoading || billingPeriodsLoading || !billingSummary) {
        return null;
    }

    const seatsHistory: SeatDay[] = dailyUsage?.Days.map((day) => ({ date: day.UsageDate, seats: day.Total })) ?? [];
    const billingPeriodsTotal = billingPeriods?.Total ?? 0;

    // The archived periods API reports `BillableLicenses` in hundredths of a license; normalize to a plain
    // license count here so every consumer of `billingPeriodRows` works in the same unit.
    const archivedRows = (billingPeriods?.BillingPeriods ?? []).map((row) => ({
        ...row,
        BillableLicenses: Math.round(row.BillableLicenses / 100),
    }));

    // The current billing period is still accruing, so it comes from the live summary endpoint
    // rather than the archived (closed) periods list, and is only shown alongside the first page of those.
    const currentPeriodRow: MspBillingPeriod = {
        BillingPeriod: billingSummary.BillingPeriod,
        Period: billingSummary.BillingPeriod,
        ManagedCompanies: billingSummary.ManagedCompanies,
        BillableLicenses: Math.round(billingSummary.TotalBilledLicenses),
        TotalCost: billingSummary.TotalCost,
        Currency: billingSummary.TotalCostCurrency,
    };
    const billingPeriodRows = page === 1 ? [currentPeriodRow, ...archivedRows] : archivedRows;

    const handleDownloadCsv = (row: MspBillingPeriod, type: MspCsvReportType) => {
        if (!mspId) {
            return;
        }
        const [year, month] = row.Period.split('-').map(Number);
        void api(getMspCsvReport(mspId, type, month, year))
            .then(downloadEvents)
            .catch(handleError);
    };

    const stats = [
        { label: c('Label').t`Billing period`, value: formatApiBillingPeriod(billingSummary.BillingPeriod) },
        { label: c('Label').t`Managed Companies`, value: String(billingSummary.ManagedCompanies) },
        { label: c('Label').t`Billable licenses`, value: Math.round(billingSummary.TotalBilledLicenses) },
        {
            label: c('Label').t`Cost per license`,
            value: getSimplePriceString(billingSummary.CostPerLicenseCurrency, billingSummary.CostPerLicense),
        },
    ];

    return (
        <SettingsSectionExtraWide className="flex flex-column gap-11">
            <div>
                <SettingsPageTitle className="mt-14">{c('Title').t`Monthly Costs`}</SettingsPageTitle>
                <SettingsParagraph>{c('Info').t`Your total monthly cost for all managed companies.`}</SettingsParagraph>
            </div>
            {/* ── Current cost card ── */}
            <div className="border border-norm rounded-lg shadow-norm px-6 py-6 flex flex-column gap-6">
                <div className="flex flex-column md:flex-row md:items-start md:justify-space-between gap-2">
                    <div className="flex items-center gap-2">
                        <IcFileLines className="shrink-0" />
                        <p className="m-0 text-bold text-lg">{c('Title').t`Current cost`}</p>
                    </div>
                    <div className="flex flex-column md:items-end">
                        <p className="m-0 text-bold text-7xl">
                            {getSimplePriceString(billingSummary.TotalCostCurrency, billingSummary.TotalCost)}
                        </p>
                        <p className="m-0 text-sm color-weak">{c('Label').t`Total cost`}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-4 md:gap-8">
                    {stats.map(({ label, value }, index) => (
                        <div
                            key={label}
                            className={clsx(
                                'flex flex-column gap-1 md:w-auto md:flex-1',
                                index === stats.length - 1 && 'md:items-end'
                            )}
                        >
                            <p className="m-0 text-bold">{value}</p>
                            <p className="m-0 text-sm color-weak">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Licenses usage chart ── */}
            {isMspCostsTableEnabled && <LicensesUsageChart data={seatsHistory} />}

            {/* ── Previous billing periods ── */}
            {isMspCostsTableEnabled && (
                <div className="flex flex-column gap-6">
                    <div className="flex flex-column gap-2">
                        <h2 className="m-0 text-bold text-5xl">{c('Title').t`Previous billing periods`}</h2>
                        <p className="m-0 color-weak">
                            {c('Info').t`Review past periods and export the data for reporting or client invoicing.`}
                        </p>
                    </div>

                    {billingPeriodRows.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <IllustrationPlaceholder url={emptyRecordsImg}>
                                <p className="m-0 text-sm color-hint text-center">
                                    {c('Info')
                                        .t`No billing breakdowns yet. Your breakdowns by billing period will appear here. Once available, you can download them as a CSV.`}
                                </p>
                            </IllustrationPlaceholder>
                        </div>
                    ) : (
                        <div className="flex flex-column gap-4">
                            <Table hasActions borderWeak responsive="cards" className="msp-billing-table">
                                <TableHeader className="msp-table-header">
                                    <TableRow>
                                        <TableHeaderCell>{c('Column header').t`Billing period`}</TableHeaderCell>
                                        <TableHeaderCell className="text-right">{c('Column header')
                                            .t`Managed companies`}</TableHeaderCell>
                                        <TableHeaderCell className="text-right">{c('Column header')
                                            .t`Billable licenses`}</TableHeaderCell>
                                        <TableHeaderCell className="text-right">{c('Column header')
                                            .t`Total cost`}</TableHeaderCell>
                                        <TableHeaderCell className="w-1/10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {billingPeriodRows.map((row) => {
                                        const rowActions = [
                                            {
                                                key: 'export-overview-as-csv',
                                                text: c('Action').t`Download monthly summary (CSV)`,
                                                className: 'text-left text-nowrap',
                                                onClick: () => handleDownloadCsv(row, 'billing-summary'),
                                            },
                                            {
                                                key: 'export-daily-breakdown-as-csv',
                                                text: c('Action').t`Download daily breakdown (CSV)`,
                                                className: 'text-left text-nowrap',
                                                onClick: () => handleDownloadCsv(row, 'daily-usage'),
                                            },
                                        ];

                                        return (
                                            <TableRow key={row.Period}>
                                                <TableCell label={c('Column header').t`Billing period`}>
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-nowrap">
                                                            {formatApiBillingPeriod(row.Period)}
                                                        </span>
                                                        {row === currentPeriodRow && (
                                                            <span className="msp-status-pill msp-status-pill--info inline-flex items-center justify-center rounded-sm text-uppercase text-normal color-weak">
                                                                <span>{c('Label').t`In progress`}</span>
                                                            </span>
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell
                                                    className="text-right"
                                                    label={c('Column header').t`Managed companies`}
                                                >
                                                    {row.ManagedCompanies}
                                                </TableCell>
                                                <TableCell
                                                    className="text-right"
                                                    label={c('Column header').t`Billable licenses`}
                                                >
                                                    {row.BillableLicenses}
                                                </TableCell>
                                                <TableCell
                                                    className="text-right"
                                                    label={c('Column header').t`Total cost`}
                                                >
                                                    {getSimplePriceString(row.Currency, row.TotalCost)}
                                                </TableCell>
                                                <TableCell className="text-right action-cell">
                                                    <DropdownActions
                                                        size="small"
                                                        shape="ghost"
                                                        iconElement={<IcThreeDotsVertical />}
                                                        list={rowActions}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {billingPeriodsTotal > PAGE_SIZE && (
                                <div className="flex justify-center">
                                    <Pagination
                                        total={billingPeriodsTotal}
                                        limit={PAGE_SIZE}
                                        page={page}
                                        onNext={onNext}
                                        onPrevious={onPrevious}
                                        onSelect={onSelect}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </SettingsSectionExtraWide>
    );
};

export default MspMonthlyCostsSection;
