import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
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
    useApi,
    usePagination,
} from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionExtraWide from '@proton/components/containers/account/SettingsSectionExtraWide';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { getMspBillingSummary } from '@proton/shared/lib/api/msp';
import { getFormattedMonths } from '@proton/shared/lib/date/date';
import type { MspBillingSummary } from '@proton/shared/lib/interfaces/MspBillingSummary';
import emptyRecordsImg from '@proton/styles/assets/img/illustrations/empty-records.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { MOCK_MONTHLY_DATA, MOCK_SEATS_HISTORY } from '../mock/monthlyCosts';
import type { MonthlyRow } from '../types';
import LicensesUsageChart from './LicensesUsageChart';

import './MspMonthlyCostsSection.scss';

const PAGE_SIZE = 15;

const MONTHS_SHORT = getFormattedMonths('MMM');

const billingPeriod = ({ month, year }: Pick<MonthlyRow, 'month' | 'year'>): string =>
    `${MONTHS_SHORT[month]}, ${year}`;

// `BillingPeriod` from the API is formatted as "MM-YYYY".
const formatApiBillingPeriod = (apiBillingPeriod: string): string => {
    const [month, year] = apiBillingPeriod.split('-').map(Number);
    return billingPeriod({ month: month - 1, year });
};

const MspMonthlyCostsSection = () => {
    const api = useApi();
    const [organization] = useOrganization();
    const mspId = organization?.ID;
    const [subscription] = useSubscription();
    const currency = subscription?.Currency;
    const isMspCostsTableEnabled = useFlag('MspCostsTableEnabled');

    const [billingSummary, setBillingSummary] = useState<MspBillingSummary>();
    const [billingSummaryLoading, setBillingSummaryLoading] = useState(true);

    useEffect(() => {
        if (!mspId) {
            return;
        }
        void api<MspBillingSummary>(getMspBillingSummary(mspId))
            .then(setBillingSummary)
            .finally(() => setBillingSummaryLoading(false));
    }, [mspId]);

    const { page, list: pageRows, onNext, onPrevious, onSelect } = usePagination(MOCK_MONTHLY_DATA, 1, PAGE_SIZE);
    if (!currency || billingSummaryLoading || !billingSummary) {
        return null;
    }

    const rowActions = [
        {
            key: 'export-overview-as-csv',
            text: c('Action').t`Download monthly summary (CSV)`,
            className: 'text-left text-nowrap',
            // @todo: implement export overview as CSV
            onClick: () => {},
        },
        {
            key: 'export-breakdown-by-company-as-zip',
            text: c('Action').t`Download daily breakdown (CSV)`,
            className: 'text-left text-nowrap',
            // @todo: implement export breakdown by company as ZIP
            onClick: () => {},
        },
    ];

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
            {isMspCostsTableEnabled && <LicensesUsageChart data={MOCK_SEATS_HISTORY} />}

            {/* ── Previous billing periods ── */}
            {isMspCostsTableEnabled && (
                <div className="flex flex-column gap-6">
                    <div className="flex flex-column gap-2">
                        <h2 className="m-0 text-bold text-5xl">{c('Title').t`Previous billing periods`}</h2>
                        <p className="m-0 color-weak">
                            {c('Info').t`Review past periods and export the data for reporting or client invoicing.`}
                        </p>
                    </div>

                    {MOCK_MONTHLY_DATA.length === 0 ? (
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
                                    {pageRows.map((row) => (
                                        <TableRow key={`${row.year}-${row.month}`}>
                                            <TableCell label={c('Column header').t`Billing period`}>
                                                <span className="text-nowrap">{billingPeriod(row)}</span>
                                            </TableCell>
                                            <TableCell
                                                className="text-right"
                                                label={c('Column header').t`Managed companies`}
                                            >
                                                {row.companies}
                                            </TableCell>
                                            <TableCell
                                                className="text-right"
                                                label={c('Column header').t`Billable licenses`}
                                            >
                                                {row.seats}
                                            </TableCell>
                                            <TableCell className="text-right" label={c('Column header').t`Total cost`}>
                                                {getSimplePriceString(currency, row.cost)}
                                            </TableCell>
                                            <TableCell className="text-right action-cell">
                                                <DropdownActions
                                                    size="small"
                                                    shape="ghost"
                                                    iconName="three-dots-vertical"
                                                    list={rowActions}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {MOCK_MONTHLY_DATA.length > PAGE_SIZE && (
                                <div className="flex justify-center">
                                    <Pagination
                                        total={MOCK_MONTHLY_DATA.length}
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
