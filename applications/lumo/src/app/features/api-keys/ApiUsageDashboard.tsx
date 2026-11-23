import { useState } from 'react';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import Price from '@proton/components/components/price/Price';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { LumoCreditsModal } from '@proton/payments-ui/ui/containers/LumoCreditsModal';
import type { LumoCreditAutoTopUpStatus } from '@proton/payments/core/api/lumoCredit';
import type { Currency } from '@proton/payments/core/interface';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useDebugApiCreditBalance, useDebugApiEmptyUsage } from '../../services/apiUsageDebugStore';
import { API_TOKEN_PRICING_MODEL_IDS, type ApiTokenPricingModelId } from '../api-docs/apiTokenPricingUsd';
import { ApiBalanceSettingsModal, getAutoTopUpSummary } from './ApiBalanceSettingsModal';
import { ApiPayAsYouGoCard } from './ApiPayAsYouGoCard';
import { ApiTokenUsageChart } from './ApiTokenUsageChart';
import { ApiTokenUsageLegend, getSwatchStyle } from './ApiTokenUsageLegend';
import { ApiUsageMembers } from './ApiUsageMembers';
import { ApiUsageMetricCard } from './ApiUsageMetricCard';
import { ApiUsageModelStats } from './ApiUsageModelStats';
import { formatTokenCount, getBalanceEstimate, getSpendingLimitSummary, toCurrencyBaseUnits } from './apiKeysHelpers';
import {
    type ApiUsageDay,
    type UsagePeriod,
    type UsageRow,
    type UsageSource,
    filterRowsBySource,
    getApiModelUsage,
    getAverageDailySpend,
    getUsageDays,
    getCostLabel,
    getPeriodDates,
    getSourceUsageDays,
    isChatHiddenByModelFilter,
    sumUsage,
} from './apiUsage';
import { useApiUsageSummary } from './useApiUsageSummary';
import { useLumoCredits } from './useLumoCredits';

const escapeCsvValue = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const exportUsageCsv = (days: ApiUsageDay[], currency: Currency) => {
    const rows = [
        ['date', 'input_tokens', 'output_tokens', `balance_used_${currency.toLowerCase()}`],
        ...days.map((day) => [day.date, day.inputTokens, day.outputTokens, day.cost?.toFixed(6) ?? '']),
    ];
    const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lumo-api-usage-${days.at(-1)?.date ?? 'export'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
};

const getSourceFilterLabel = (source: 'all' | UsageSource) =>
    ({
        all: c('collider_2025: Label').t`All sources`,
        api: c('collider_2025: Label').t`API`,
        chat: c('collider_2025: Label').t`Chat`,
    })[source];

const SourceTokenSplit = ({
    apiTokens,
    chatTokens,
    tokenType,
}: {
    apiTokens: number;
    chatTokens: number;
    tokenType: 'Input' | 'Output';
}) => (
    <span className="api-usage-chart-legend flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1" style={getSwatchStyle(`api${tokenType}Tokens`)}>
            {getSourceFilterLabel('api')} {formatTokenCount(apiTokens)}
        </span>
        <span className="inline-flex items-center gap-1" style={getSwatchStyle(`chat${tokenType}Tokens`)}>
            {getSourceFilterLabel('chat')} {formatTokenCount(chatTokens)}
        </span>
    </span>
);

const ApiUsageOverviewContent = ({
    rows,
    dates,
    currency,
}: {
    rows: UsageRow[];
    dates: string[];
    currency: Currency;
}) => {
    const [selectedModel, setSelectedModel] = useState<'all' | ApiTokenPricingModelId>('all');
    const [selectedSource, setSelectedSource] = useState<'all' | UsageSource>('all');
    const totals = sumUsage(rows);
    const apiTotals = sumUsage(filterRowsBySource(rows, 'api'));
    const chatTotals = sumUsage(filterRowsBySource(rows, 'chat'));
    const modelUsage = API_TOKEN_PRICING_MODEL_IDS.map((model) => getApiModelUsage(rows, model));
    const modelRows = selectedModel === 'all' ? rows : rows.filter((row) => row.Model === selectedModel);
    const chartDays = getSourceUsageDays(filterRowsBySource(modelRows, selectedSource), dates);
    return (
        <div className="api-usage-overview-content flex flex-column gap-7">
            <div className="api-usage-metrics gap-2.5">
                <ApiUsageMetricCard
                    icon="DollarSign"
                    label={c('collider_2025: Label').t`Balance used`}
                    value={getCostLabel(totals.cost, currency)}
                    hint={c('collider_2025: Info').t`Estimated spend`}
                />
                <ApiUsageMetricCard
                    icon="ArrowDownToLine"
                    label={c('collider_2025: Label').t`Input tokens`}
                    value={formatTokenCount(totals.inputTokens)}
                    hint={c('collider_2025: Info').t`Prompts and context`}
                    breakdown={
                        <SourceTokenSplit
                            apiTokens={apiTotals.inputTokens}
                            chatTokens={chatTotals.inputTokens}
                            tokenType="Input"
                        />
                    }
                />
                <ApiUsageMetricCard
                    icon="ArrowUpFromLine"
                    label={c('collider_2025: Label').t`Output tokens`}
                    value={formatTokenCount(totals.outputTokens)}
                    hint={c('collider_2025: Info').t`Model responses`}
                    breakdown={
                        <SourceTokenSplit
                            apiTokens={apiTotals.outputTokens}
                            chatTokens={chatTotals.outputTokens}
                            tokenType="Output"
                        />
                    }
                />
            </div>

            <section className="api-usage-chart-card bg-transparent p-0">
                <div className="api-usage-chart-header flex flex-column items-stretch justify-space-between gap-4 mb-4 md:flex-row md:items-start">
                    <div>
                        <h4 className="m-0 lumo-label-small lumo-color-glyph">{c('collider_2025: Title')
                            .t`Token usage`}</h4>
                        <p className="m-0 mt-1 lumo-body-small lumo-color-glyph-mid">
                            {c('collider_2025: Info').t`Daily usage by token type`}
                        </p>
                    </div>
                    <div className="flex flex-column items-start gap-3 md:items-end">
                        <div className="flex flex-wrap gap-2">
                            <fieldset className="api-usage-model-filter m-0 api-usage-model-filter--sources flex items-center gap-0.5 radius-8 lumo-bg-control-fill">
                                <legend className="sr-only">{c('collider_2025: Label')
                                    .t`Filter token usage by source`}</legend>
                                {(['all', 'api', 'chat'] as const).map((source) => (
                                    <button
                                        key={source}
                                        type="button"
                                        aria-pressed={selectedSource === source}
                                        onClick={() => setSelectedSource(source)}
                                    >
                                        {getSourceFilterLabel(source)}
                                    </button>
                                ))}
                            </fieldset>
                            <fieldset className="api-usage-model-filter m-0 flex items-center gap-0.5 radius-8 lumo-bg-control-fill">
                                <legend className="sr-only">{c('collider_2025: Label')
                                    .t`Filter token usage by model`}</legend>
                                {(['all', 'lumo-lite', 'lumo-max'] as const).map((model) => (
                                    <button
                                        key={model}
                                        type="button"
                                        aria-pressed={selectedModel === model}
                                        onClick={() => setSelectedModel(model)}
                                    >
                                        {model === 'all' ? c('collider_2025: Label').t`All models` : model}
                                    </button>
                                ))}
                            </fieldset>
                        </div>
                        <ApiTokenUsageLegend source={selectedSource} />
                        {isChatHiddenByModelFilter(rows, selectedModel, selectedSource) && (
                            <p className="text-xs color-weak m-0">
                                {c('collider_2025: Info')
                                    .t`Chat usage isn't broken down by model. Select All models to include it.`}
                            </p>
                        )}
                    </div>
                </div>
                <div className="api-usage-main-chart">
                    <ApiTokenUsageChart days={chartDays} formatBalance={(value) => getCostLabel(value, currency)} />
                </div>
            </section>

            <div className="api-usage-models-grid gap-2.5">
                {modelUsage.map((usage) => (
                    <ApiUsageModelStats
                        key={usage.model}
                        model={usage.model}
                        inputTokens={usage.inputTokens}
                        outputTokens={usage.outputTokens}
                        formattedCost={getCostLabel(usage.cost, currency)}
                    />
                ))}
            </div>
        </div>
    );
};

const ApiUsageOverview = ({
    rows,
    dates,
    hasAnyUsage,
    isLoading,
    error,
    currency,
}: {
    rows: UsageRow[];
    dates: string[];
    hasAnyUsage: boolean;
    isLoading: boolean;
    error: boolean;
    currency: Currency;
}) => {
    if (isLoading) {
        return <p className="m-0 lumo-body-small lumo-color-glyph-mid">{c('collider_2025: Info').t`Loading usage…`}</p>;
    }

    if (error) {
        return (
            <p className="m-0 lumo-body-small lumo-color-glyph-mid">{c('collider_2025: Error')
                .t`Could not load usage.`}</p>
        );
    }

    if (!hasAnyUsage) {
        return (
            <div className="api-usage-empty p-6 flex flex-column items-center justify-center border lumo-border radius-12 text-center lumo-bg-control-fill">
                <span className="api-usage-empty__icon flex items-center justify-center mb-3 radius-full lumo-color-glyph-brand-text lumo-bg-control-fill">
                    <LumoIcon name="Activity" size={20} />
                </span>
                <h4 className="m-0 lumo-label-small lumo-color-glyph">{c('collider_2025: Title')
                    .t`No API usage yet`}</h4>
                <p className="m-0 mt-1 lumo-body-small lumo-color-glyph-mid">
                    {c('collider_2025: Info').t`Usage data will appear here after the first API request.`}
                </p>
            </div>
        );
    }

    return <ApiUsageOverviewContent rows={rows} dates={dates} currency={currency} />;
};

const ApiUsageHeader = ({ isOrgMember }: { isOrgMember: boolean }) => (
    <header className="pt-2 pb-3 min-w-0">
        <h2 className="api-usage-dashboard__title m-0 lumo-title-large lumo-color-glyph">{c('collider_2025: Title')
            .t`API usage & balance`}</h2>
        <p className="api-usage-dashboard__subtitle m-0 mt-1 lumo-body-large lumo-color-glyph-mid">
            {isOrgMember
                ? c('collider_2025: Info').t`Monitor your organization's API balance and token usage.`
                : c('collider_2025: Info').t`Monitor your API balance, tokens, and spending controls.`}
        </p>
    </header>
);

const getBalanceStatus = (balance: number) => {
    if (balance <= 0) {
        return 'empty';
    }
    return balance <= 10 ? 'low' : 'available';
};

const ApiBalanceStatusMessage = ({ balance, isOrgMember }: { balance: number; isOrgMember: boolean }) => {
    const status = getBalanceStatus(balance);
    if (status === 'available') {
        return null;
    }

    const message = (() => {
        if (isOrgMember) {
            return status === 'empty'
                ? c('collider_2025: Status')
                      .t`Organization API requests are paused. Contact your organization administrator to top up the balance.`
                : c('collider_2025: Status')
                      .t`Your organization API balance is running low. Contact your organization administrator to avoid interruptions.`;
        }
        return status === 'empty'
            ? c('collider_2025: Status').t`API requests are paused. Top up your balance to resume requests.`
            : c('collider_2025: Status')
                  .t`Your API balance is running low. Top up your balance to avoid interruptions.`;
    })();

    return (
        <output
            className={`api-usage-balance-status py-2 px-3 lumo-color-glyph api-usage-balance-status--${status} flex flex-nowrap items-center gap-2 radius-12 lumo-body-small`}
        >
            <LumoIcon name={status === 'empty' ? 'Pause' : 'TriangleExclamationPoint'} size={14} className="shrink-0" />
            {message}
        </output>
    );
};

const getAutoTopUpReasonMessage = (reason: string | undefined) => {
    if (reason === 'PaymentFailed') {
        return c('collider_2025: Status').t`The last payment did not go through.`;
    }
    if (reason === 'NoAutopay') {
        return c('collider_2025: Status').t`Automatic payments are off for your payment method.`;
    }
    return undefined;
};

const getAutoTopUpTitle = (enabled: boolean, status: LumoCreditAutoTopUpStatus | undefined) => {
    if (status === 'Failed') {
        return c('collider_2025: Title').t`Automatic top-up failed`;
    }
    if (status === 'Paused') {
        return c('collider_2025: Title').t`Automatic top-up paused`;
    }
    return enabled
        ? c('collider_2025: Title').t`Automatic top-up enabled`
        : c('collider_2025: Title').t`Automatic top-up off`;
};

const ApiAutoTopUpStatusMessage = ({
    status,
    reason,
}: {
    status: LumoCreditAutoTopUpStatus;
    reason: string | undefined;
}) => {
    const reasonMessage = getAutoTopUpReasonMessage(reason);
    return (
        <output className="api-usage-balance-status py-2 px-3 lumo-color-glyph api-usage-balance-status--low flex flex-nowrap items-center gap-2 radius-12 lumo-body-small">
            <LumoIcon name="TriangleExclamationPoint" size={14} className="shrink-0" />
            <span>
                {status === 'Failed'
                    ? c('collider_2025: Status')
                          .t`Automatic top-up failed. Update your payment method to resume automatic top-ups.`
                    : c('collider_2025: Status')
                          .t`Automatic top-up paused. Update your payment method to resume automatic top-ups.`}
                {reasonMessage && ` ${reasonMessage}`}
            </span>
        </output>
    );
};

const ApiBalanceCard = ({
    balance,
    isBalanceLoading,
    credits,
    currency,
    averageDailySpend,
    isOrgMember,
    canManageBalance,
    canChargeAutoTopUp,
    showAutoTopUp,
    topUpDisabled,
    onTopUp,
    canTopUp,
}: {
    balance: number | undefined;
    isBalanceLoading: boolean;
    credits: ReturnType<typeof useLumoCredits>;
    currency: Currency;
    averageDailySpend: number;
    isOrgMember: boolean;
    canManageBalance: boolean;
    canChargeAutoTopUp: boolean;
    showAutoTopUp: boolean;
    topUpDisabled: boolean;
    onTopUp: () => void;
    canTopUp: boolean;
}) => {
    const { settings, spent, autoTopUpStatus } = credits;
    const { autoTopUp, spendingLimit } = settings;
    const [settingsModalProps, setSettingsModalOpen, renderSettingsModal] = useModalState();

    const spendingLimitSummary = getSpendingLimitSummary(spent, autoTopUp, spendingLimit, currency);

    return (
        <section
            className="api-usage-balance-card flex flex-column overflow-hidden border lumo-border radius-16 lumo-bg-panel"
            aria-labelledby="api-usage-balance-label"
        >
            <div className="api-usage-balance-card__main flex flex-column gap-4">
                <div className="flex flex-nowrap items-center justify-space-between gap-4">
                    <div className="api-usage-credit-balance flex flex-column items-start gap-0.5 min-w-0">
                        <span id="api-usage-balance-label">
                            {isOrgMember
                                ? c('collider_2025: Label').t`Organization API balance`
                                : c('collider_2025: Label').t`Remaining balance`}
                        </span>
                        {balance === undefined ? (
                            <small className="lumo-color-glyph-mid">
                                {isBalanceLoading
                                    ? c('collider_2025: Info').t`Loading balance…`
                                    : c('collider_2025: Info').t`Balance unavailable`}
                            </small>
                        ) : (
                            <>
                                <Price currency={currency} className="api-usage-balance-amount">
                                    {toCurrencyBaseUnits(balance, currency)}
                                </Price>
                                <small className="lumo-color-glyph-mid">
                                    {getBalanceEstimate(balance, averageDailySpend)}
                                </small>
                            </>
                        )}
                    </div>
                    {!isOrgMember && canTopUp && (
                        <Button color="norm" className="shrink-0" disabled={topUpDisabled} onClick={onTopUp}>
                            {c('collider_2025: Action').t`Top up balance`}
                        </Button>
                    )}
                </div>
                {balance !== undefined && <ApiBalanceStatusMessage balance={balance} isOrgMember={isOrgMember} />}
                {showAutoTopUp && !isOrgMember && autoTopUpStatus && (
                    <ApiAutoTopUpStatusMessage status={autoTopUpStatus} reason={credits.autoTopUpReason} />
                )}
            </div>

            {showAutoTopUp && !isOrgMember && (
                <div className="api-usage-balance-card__settings border-top lumo-border lumo-bg-control-fill py-5 api-usage-balance-row flex flex-nowrap items-center gap-4">
                    <span className="api-usage-balance-row__icon relative flex flex-none items-center justify-center border lumo-border radius-12 lumo-color-glyph lumo-bg-panel">
                        <LumoIcon name="RefreshCw" size={18} />
                        {autoTopUp.enabled && !autoTopUpStatus && (
                            <span className="api-usage-balance-row__badge lumo-bg-signal-success absolute flex items-center justify-center radius-full">
                                <LumoIcon name="Check" size={10} strokeWidth={3} />
                            </span>
                        )}
                    </span>
                    <div className="flex flex-column gap-1 flex-1 min-w-0">
                        <strong className="lumo-color-glyph">
                            {getAutoTopUpTitle(autoTopUp.enabled, autoTopUpStatus)}
                        </strong>
                        <span className="lumo-body-small lumo-color-glyph-mid">
                            {autoTopUp.enabled
                                ? getAutoTopUpSummary(autoTopUp, currency)
                                : c('collider_2025: Info').t`Keep API requests running when your balance gets low.`}
                        </span>
                        {spendingLimitSummary && (
                            <span
                                className={
                                    spendingLimitSummary.isLimitReached
                                        ? 'lumo-label-medium lumo-color-signal-danger'
                                        : 'lumo-body-small lumo-color-glyph-mid'
                                }
                            >
                                {spendingLimitSummary.text}
                            </span>
                        )}
                    </div>
                    {canManageBalance && !credits.loading && !credits.error && (
                        <Button
                            color="weak"
                            className="shrink-0"
                            aria-label={c('collider_2025: Action').t`Manage automatic top-up and spending limit`}
                            onClick={() => setSettingsModalOpen(true)}
                        >
                            {c('collider_2025: Action').t`Manage`}
                        </Button>
                    )}
                </div>
            )}

            {renderSettingsModal && (
                <ApiBalanceSettingsModal
                    {...settingsModalProps}
                    settings={settings}
                    currency={currency}
                    balance={balance}
                    spent={spent}
                    canChargeAutoTopUp={canChargeAutoTopUp}
                    onSave={credits.saveSettings}
                />
            )}
        </section>
    );
};

export const ApiUsageDashboard = ({
    isOrgAdmin,
    isOrgMember,
    canManageBalance = true,
    canChargeAutoTopUp = true,
    showAutoTopUp = false,
    canTopUp = true,
}: {
    isOrgAdmin: boolean;
    isOrgMember: boolean;
    canManageBalance?: boolean;
    canChargeAutoTopUp?: boolean;
    showAutoTopUp?: boolean;
    canTopUp?: boolean;
}) => {
    const { APP_NAME } = useConfig();
    const [{ Currency }] = useUser();
    const [subscription] = useSubscription();
    const [paymentStatus, paymentStatusLoading] = usePaymentStatus();
    const lumoCredits = useLumoCredits();
    const [creditModalProps, setCreditModalOpen, renderCreditModal] = useModalState();
    const creditBalanceOverride = useDebugApiCreditBalance();
    const emptyUsageEnabled = useDebugApiEmptyUsage();
    const displayedCreditBalance = creditBalanceOverride ?? lumoCredits.balance;
    const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>('last-30-days');
    const usageSummary = useApiUsageSummary(isOrgAdmin ? 'organization' : 'self');
    const usageRows = emptyUsageEnabled ? [] : usageSummary.rows;
    const periodDates = getPeriodDates(usageSummary.dates, usagePeriod);
    const periodRows = usageRows.filter((row) => periodDates.includes(row.Date));
    const usageDays = getUsageDays(periodRows, periodDates);
    const periodLabel = {
        'last-7-days': c('collider_2025: Date range').t`Last 7 days`,
        'last-30-days': c('collider_2025: Date range').t`Last 30 days`,
        'previous-30-days': c('collider_2025: Date range').t`Previous 30 days`,
        'last-90-days': c('collider_2025: Date range').t`Last 90 days`,
    }[usagePeriod];
    const recentDates = getPeriodDates(usageSummary.dates, 'last-30-days');
    const averageDailySpend = isOrgMember
        ? 0
        : getAverageDailySpend(
              usageRows.filter((row) => recentDates.includes(row.Date)),
              recentDates.length
          );

    return (
        <section
            className="api-usage-dashboard flex flex-column gap-4 w-full min-w-0"
            aria-label={c('collider_2025: Title').t`API usage dashboard`}
        >
            <ApiUsageHeader isOrgMember={isOrgMember} />
            <div className="api-usage-account-grid gap-4">
                <ApiBalanceCard
                    balance={displayedCreditBalance}
                    isBalanceLoading={lumoCredits.loading}
                    credits={lumoCredits}
                    currency={subscription?.Currency ?? Currency}
                    averageDailySpend={averageDailySpend}
                    isOrgMember={isOrgMember}
                    canManageBalance={canManageBalance}
                    canChargeAutoTopUp={canChargeAutoTopUp}
                    showAutoTopUp={showAutoTopUp}
                    topUpDisabled={paymentStatusLoading || !paymentStatus}
                    onTopUp={() => setCreditModalOpen(true)}
                    canTopUp={canTopUp}
                />
                <ApiPayAsYouGoCard />
            </div>

            <section className="api-usage-overview-section w-full min-w-0 border lumo-border radius-16 lumo-bg-panel">
                <div className="api-usage-period-row flex flex-column items-stretch justify-space-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h3 className="m-0 lumo-title-medium lumo-color-glyph">{c('collider_2025: Title').t`Usage`}</h3>
                        <p className="m-0 mt-1 lumo-body-small lumo-color-glyph-mid">
                            {c('collider_2025: Info').t`Review token usage and balance deductions over time.`}
                        </p>
                    </div>
                    <div className="api-usage-period-actions flex flex-nowrap items-center gap-2">
                        <Button
                            color="weak"
                            className="flex flex-nowrap items-center gap-2 shrink-0"
                            disabled={periodRows.length === 0}
                            onClick={() => exportUsageCsv(usageDays, Currency)}
                        >
                            <LumoIcon name="ArrowDownToLine" size={16} />
                            {c('collider_2025: Action').t`Export CSV`}
                        </Button>
                        <SelectTwo
                            className="api-usage-period"
                            value={usagePeriod}
                            onValue={(value) => setUsagePeriod(value as UsagePeriod)}
                            aria-label={c('collider_2025: Label').t`Usage period`}
                            fullWidth={false}
                        >
                            <Option value="last-7-days" title={c('collider_2025: Date range').t`Last 7 days`} />
                            <Option value="last-30-days" title={c('collider_2025: Date range').t`Last 30 days`} />
                            <Option
                                value="previous-30-days"
                                title={c('collider_2025: Date range').t`Previous 30 days`}
                            />
                            <Option value="last-90-days" title={c('collider_2025: Date range').t`Last 90 days`} />
                        </SelectTwo>
                    </div>
                </div>
                <ApiUsageOverview
                    rows={periodRows}
                    hasAnyUsage={usageRows.length > 0}
                    dates={periodDates}
                    isLoading={usageSummary.isLoading}
                    error={usageSummary.error}
                    currency={Currency}
                />
            </section>

            {isOrgAdmin && (
                <section className="api-usage-members-section w-full min-w-0 border lumo-border radius-16 lumo-bg-panel">
                    <ApiUsageMembers
                        from={periodDates[0]}
                        to={periodDates.at(-1)}
                        periodLabel={periodLabel}
                        currency={Currency}
                    />
                </section>
            )}

            {canTopUp && renderCreditModal && paymentStatus && (
                <LumoCreditsModal
                    app={APP_NAME}
                    paymentStatus={paymentStatus}
                    onSuccess={lumoCredits.waitForBalanceIncrease}
                    {...creditModalProps}
                />
            )}
        </section>
    );
};
