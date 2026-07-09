import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import {
    DropdownActions,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    usePagination,
} from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionExtraWide from '@proton/components/containers/account/SettingsSectionExtraWide';
import { getFormattedMonths } from '@proton/shared/lib/date/date';
import { useFlag } from '@proton/unleash/useFlag';

import { MOCK_MONTHLY_DATA, MOCK_SEATS_HISTORY, MONTHLY_RATE } from '../mock/monthlyCosts';
import type { MonthlyRow } from '../types';
import SeatsUsageChart from './SeatsUsageChart';

import './MspMonthlyCostsSection.scss';

const PAGE_SIZE = 15;

const MONTHS_SHORT = getFormattedMonths('MMM');

const billingPeriod = (row: MonthlyRow): string => `${MONTHS_SHORT[row.month]}, ${row.year}`;

const MspMonthlyCostsSection = () => {
    const [subscription] = useSubscription();
    const currency = subscription?.Currency;
    const isMspCostsTableEnabled = useFlag('MspCostsTableEnabled');

    const { page, list: pageRows, onNext, onPrevious, onSelect } = usePagination(MOCK_MONTHLY_DATA, 1, PAGE_SIZE);
    if (!currency) {
        return null;
    }

    const currentRow = MOCK_MONTHLY_DATA[0];

    const rowActions = [
        {
            key: 'export-overview-as-csv',
            text: c('Action').t`Export overview as CSV`,
            className: 'text-left text-nowrap',
            // @todo: implement export overview as CSV
            onClick: () => {},
        },
        {
            key: 'export-breakdown-by-company-as-zip',
            text: c('Action').t`Export breakdown by company as ZIP`,
            className: 'text-left text-nowrap',
            // @todo: implement export breakdown by company as ZIP
            onClick: () => {},
        },
    ];

    const stats = [
        {
            label: c('Label').t`Billed seats`,
            value: currentRow.seats,
            sub: c('Info').t`Average`,
        },
        { label: c('Label').t`Companies`, value: String(currentRow.companies), sub: c('Info').t`Active` },
        {
            label: c('Label').t`Cost`,
            value: getSimplePriceString(currency, MONTHLY_RATE),
            sub: c('Info').t`Per seat/month`,
        },
    ];

    return (
        <SettingsSectionExtraWide className="flex flex-column gap-11">
            <div>
                <SettingsPageTitle className="mt-14">{c('Title').t`Monthly Costs`}</SettingsPageTitle>
                <SettingsParagraph>{c('Info').t`Your total monthly cost for all managed companies.`}</SettingsParagraph>
            </div>
            {/* ── Cost overview card ── */}
            <div className="border border-norm rounded-lg shadow-norm px-6 pt-6 pb-8 flex flex-column-md flex-row items-center gap-8">
                <div className="flex flex-column gap-1 flex-1">
                    <p className="m-0 text-semibold">{c('Label').t`Total cost`}</p>
                    <p className="m-0 text-bold text-7xl">{getSimplePriceString(currency, currentRow.cost)}</p>
                    <p className="m-0 text-sm color-weak">{billingPeriod(currentRow)}</p>
                </div>
                <div className="flex gap-6 flex-1">
                    {stats.map(({ label, value, sub }) => (
                        <div key={label} className="flex flex-column gap-1 flex-1">
                            <p className="m-0 text-semibold">{label}</p>
                            <p className="m-0 text-bold text-2xl">{value}</p>
                            <p className="m-0 text-sm color-weak">{sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Seats usage chart ── */}
            {isMspCostsTableEnabled && <SeatsUsageChart data={MOCK_SEATS_HISTORY} />}

            {/* ── Previous billing periods ── */}
            {isMspCostsTableEnabled && (
                <div className="flex flex-column gap-6">
                    <div className="flex flex-column gap-2">
                        <h2 className="m-0 text-bold text-5xl">{c('Title').t`Previous billing periods`}</h2>
                        <p className="m-0 color-weak">
                            {c('Info').t`Review past periods and export the data for reporting or client invoicing.`}
                        </p>
                    </div>

                    <div className="flex flex-column gap-4">
                        <Table hasActions borderWeak responsive="cards" className="msp-billing-table">
                            <TableHeader className="msp-table-header">
                                <TableRow>
                                    <TableHeaderCell>{c('Column header').t`Billing period`}</TableHeaderCell>
                                    <TableHeaderCell className="text-right">{c('Column header')
                                        .t`Managed companies`}</TableHeaderCell>
                                    <TableHeaderCell className="text-right">{c('Column header')
                                        .t`Total billed seats`}</TableHeaderCell>
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
                                            label={c('Column header').t`Total billed seats`}
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
                </div>
            )}
        </SettingsSectionExtraWide>
    );
};

export default MspMonthlyCostsSection;
