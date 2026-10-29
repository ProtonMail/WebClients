import { useMemo, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Input } from '@proton/atoms/Input/Input';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import Price from '@proton/components/components/price/Price';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import { LumoCreditsModal } from '@proton/components/containers/payments/LumoCreditsModal';
import type { Currency } from '@proton/payments/core/interface';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useDebugApiCreditBalance, useDebugApiEmptyUsage } from '../../services/apiUsageDebugStore';
import { type ApiBalanceSettings, ApiBalanceSettingsModal, getAutoTopUpSummary } from './ApiBalanceSettingsModal';
import { ApiPayAsYouGoCard } from './ApiPayAsYouGoCard';
import { ApiTokenUsageChart } from './ApiTokenUsageChart';
import { ApiUsageMetricCard } from './ApiUsageMetricCard';
import { ApiUsageModelStats } from './ApiUsageModelStats';
import { formatApiCurrency, formatTokenCount, toCurrencyBaseUnits } from './apiKeysHelpers';
import {
    type ApiModelUsage,
    type ApiUsageDay,
    type ApiUsageModel,
    MOCK_API_CREDIT_RATES,
    MOCK_API_USAGE_MEMBERS,
    getMockApiUsageDays,
} from './apiUsageMockData';
import { useCanBuyLumoCredits } from './useCanBuyLumoCredits';
import { useLumoCredits } from './useLumoCredits';

type UsagePeriod = 'last-7-days' | 'last-30-days' | 'previous-30-days' | 'last-90-days';

const escapeCsvValue = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

const exportUsageCsv = (days: ApiUsageDay[], currency: Currency) => {
    const rows = [
        ['date', 'input_tokens', 'output_tokens', `balance_used_${currency.toLowerCase()}`],
        ...days.map((day) => [day.date, day.inputTokens, day.outputTokens, day.cost.toFixed(6)]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lumo-api-usage-${days.at(-1)?.date ?? 'export'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
};

const getModelUsageCost = (usage: ApiModelUsage) => {
    const rates = MOCK_API_CREDIT_RATES[usage.model];
    return (
        (usage.inputTokens / 1_000_000) * rates.input +
        (usage.outputTokens / 1_000_000) * rates.output +
        (usage.cacheInputTokens / 1_000_000) * (rates.cacheInput ?? 0)
    );
};

const ApiAccessToggle = ({
    id,
    enabled,
    label,
    onChange,
}: {
    id: string;
    enabled: boolean;
    label: string;
    onChange: () => void;
}) => <Toggle id={id} checked={enabled} aria-label={label} onChange={onChange} className="shrink-0" />;

const ApiUsageOverviewContent = ({ days, currency }: { days: ApiUsageDay[]; currency: Currency }) => {
    const [selectedModel, setSelectedModel] = useState<'all' | ApiUsageModel>('all');
    const totals = useMemo(
        () =>
            days.reduce(
                (result, day) => ({
                    inputTokens: result.inputTokens + day.inputTokens,
                    outputTokens: result.outputTokens + day.outputTokens,
                    cacheInputTokens: result.cacheInputTokens + day.cacheInputTokens,
                }),
                { inputTokens: 0, outputTokens: 0, cacheInputTokens: 0 }
            ),
        [days]
    );
    const modelUsage = (['lumo-lite', 'lumo-max'] as const).map((model) => {
        const modelShare = model === 'lumo-lite' ? 0.65 : 0.35;
        const usage: ApiModelUsage = {
            model,
            inputTokens: Math.round(totals.inputTokens * modelShare),
            outputTokens: Math.round(totals.outputTokens * modelShare),
            cacheInputTokens: Math.round(totals.cacheInputTokens * modelShare),
        };

        return { ...usage, cost: getModelUsageCost(usage) };
    });
    const estimatedCost = modelUsage.reduce((sum, usage) => sum + usage.cost, 0);
    const chartDays = useMemo(() => {
        if (selectedModel === 'all') {
            return days;
        }

        const modelShare = selectedModel === 'lumo-lite' ? 0.65 : 0.35;
        return days.map((day) => {
            const usage: ApiModelUsage = {
                model: selectedModel,
                inputTokens: Math.round(day.inputTokens * modelShare),
                outputTokens: Math.round(day.outputTokens * modelShare),
                cacheInputTokens: Math.round(day.cacheInputTokens * modelShare),
            };

            return { ...day, ...usage, cost: getModelUsageCost(usage) };
        });
    }, [days, selectedModel]);
    return (
        <div className="api-usage-overview-content flex flex-column gap-7">
            <div className="api-usage-metrics">
                <ApiUsageMetricCard
                    icon="DollarSign"
                    label={c('collider_2025: Label').t`Balance used`}
                    value={formatApiCurrency(estimatedCost, currency)}
                    hint={c('collider_2025: Info').t`Estimated API spend`}
                />
                <ApiUsageMetricCard
                    icon="ArrowDownToLine"
                    label={c('collider_2025: Label').t`Input tokens`}
                    value={formatTokenCount(totals.inputTokens)}
                    hint={c('collider_2025: Info').t`Prompts and context`}
                />
                <ApiUsageMetricCard
                    icon="ArrowUpFromLine"
                    label={c('collider_2025: Label').t`Output tokens`}
                    value={formatTokenCount(totals.outputTokens)}
                    hint={c('collider_2025: Info').t`Model responses`}
                />
            </div>

            <section className="api-usage-chart-card">
                <div className="api-usage-chart-header flex flex-column items-stretch justify-space-between gap-4 mb-4 md:flex-row md:items-start">
                    <div>
                        <h4 className="text-sm text-bold color-norm m-0">{c('collider_2025: Title').t`Token usage`}</h4>
                        <p className="text-xs color-weak m-0 mt-1">
                            {c('collider_2025: Info').t`Daily usage by token type`}
                        </p>
                    </div>
                    <div className="flex flex-column items-start gap-3 md:items-end">
                        <fieldset className="api-usage-model-filter flex items-center gap-0.5">
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
                        <div className="api-usage-chart-legend flex flex-wrap justify-end gap-3">
                            <span className="api-usage-chart-legend__input inline-flex items-center gap-1.5">
                                {c('collider_2025: Label').t`Input`}
                            </span>
                            <span className="api-usage-chart-legend__output inline-flex items-center gap-1.5">
                                {c('collider_2025: Label').t`Output`}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="api-usage-main-chart">
                    <ApiTokenUsageChart
                        days={chartDays.map((day) => ({
                            date: day.date,
                            inputTokens: day.inputTokens,
                            outputTokens: day.outputTokens,
                            balanceUsed: day.cost,
                        }))}
                        formatBalance={(value) => formatApiCurrency(value, currency)}
                    />
                </div>
            </section>

            <div className="api-usage-models-grid">
                {modelUsage.map((usage) => (
                    <div key={usage.model} className="api-usage-model rounded-lg border border-weak">
                        <span className={`api-usage-model__name api-usage-model__name--${usage.model} inline-flex`}>
                            {usage.model}
                        </span>
                        <ApiUsageModelStats
                            model={usage.model}
                            inputTokens={usage.inputTokens}
                            outputTokens={usage.outputTokens}
                            formattedCost={formatApiCurrency(usage.cost, currency)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ApiUsageOverview = ({ days, currency }: { days: ApiUsageDay[]; currency: Currency }) => {
    if (days.length === 0) {
        return (
            <div className="api-usage-empty flex flex-column items-center justify-center text-center rounded-lg border border-weak bg-weak">
                <span className="api-usage-empty__icon flex items-center justify-center rounded-full mb-3">
                    <LumoIcon name="Activity" size={20} />
                </span>
                <h4 className="text-sm text-bold color-norm m-0">{c('collider_2025: Title').t`No API usage yet`}</h4>
                <p className="text-xs color-weak m-0 mt-1">
                    {c('collider_2025: Info').t`Usage data will appear here after the first API request.`}
                </p>
            </div>
        );
    }

    return <ApiUsageOverviewContent days={days} currency={currency} />;
};

const ApiUsageMembers = ({
    hasCredits,
    periodLabel,
    usageScale,
    currency,
}: {
    hasCredits: boolean;
    periodLabel: string;
    usageScale: number;
    currency: Currency;
}) => {
    const [members, setMembers] = useState(MOCK_API_USAGE_MEMBERS);
    const [search, setSearch] = useState('');
    const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(() => new Set());
    const filteredMembers = members.filter((member) => member.name.toLowerCase().includes(search.toLowerCase()));
    const enabledMemberCount = members.filter((member) => member.apiAccess).length;

    const toggleAccess = (memberId: string) => {
        setMembers((current) =>
            current.map((member) => (member.id === memberId ? { ...member, apiAccess: !member.apiAccess } : member))
        );
    };

    const toggleMemberDetails = (memberId: string) => {
        setExpandedMemberIds((current) => {
            const next = new Set(current);
            if (next.has(memberId)) {
                next.delete(memberId);
            } else {
                next.add(memberId);
            }
            return next;
        });
    };

    return (
        <div className="api-usage-members flex flex-column gap-4 w-full max-w-full min-w-0">
            <div className="api-usage-members-toolbar flex flex-column items-stretch justify-space-between gap-3 md:flex-row md:items-center">
                <div>
                    <h3 className="text-lg text-semibold color-norm m-0">{c('collider_2025: Title')
                        .t`Member usage`}</h3>
                    <p className="text-sm color-weak m-0 mt-1">
                        {hasCredits
                            ? c('collider_2025: Info')
                                  .t`Review spending and control API access by member for ${periodLabel}.`
                            : c('collider_2025: Info')
                                  .t`Configure member access for when a balance is available. Usage shown for ${periodLabel}.`}
                    </p>
                </div>
                <div className="api-usage-members-actions flex items-center gap-2 w-full md:w-auto">
                    <ButtonLike as={SettingsLink} path="/users-addresses" color="weak" size="small">
                        {c('collider_2025: Action').t`Add user`}
                    </ButtonLike>
                    <Input
                        type="search"
                        value={search}
                        onValue={setSearch}
                        placeholder={c('collider_2025: Placeholder').t`Search members`}
                        aria-label={c('collider_2025: Label').t`Search members`}
                        prefix={<LumoIcon name="Search" size={15} className="color-weak" />}
                        className="api-usage-search flex-1 shrink-0 md:flex-none"
                    />
                </div>
            </div>

            {usageScale === 0 ? (
                <div className="api-usage-empty flex flex-column items-center justify-center text-center rounded-lg border border-weak bg-weak">
                    <span className="api-usage-empty__icon flex items-center justify-center rounded-full mb-3">
                        <LumoIcon name="Users" size={20} />
                    </span>
                    <h4 className="text-sm text-bold color-norm m-0">
                        {c('collider_2025: Title').t`No member API usage yet`}
                    </h4>
                    <p className="text-xs color-weak m-0 mt-1">
                        {c('collider_2025: Info')
                            .t`Usage will appear here after organization members make API requests.`}
                    </p>
                </div>
            ) : (
                <>
                    <div className="api-usage-members-summary">
                        <div className="flex flex-column gap-1">
                            <span>{c('collider_2025: Label').t`Members`}</span>
                            <strong>{members.length}</strong>
                        </div>
                        <div className="flex flex-column gap-1">
                            <span>{c('collider_2025: Label').t`Allowed API access`}</span>
                            <strong>{c('collider_2025: Info').t`${enabledMemberCount} of ${members.length}`}</strong>
                        </div>
                    </div>

                    <div className="api-usage-member-list">
                        {filteredMembers.map((member) => (
                            <article key={member.id} className="api-usage-member-card rounded-xl border border-weak">
                                <header className="api-usage-member-card__header flex flex-wrap items-start justify-space-between gap-4 md:flex-nowrap md:items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="api-usage-member-avatar flex items-center justify-center rounded-lg">
                                            {member.name.slice(0, 1)}
                                        </span>
                                        <span className="flex flex-column">
                                            <strong>{member.name}</strong>
                                            <small>{member.role}</small>
                                        </span>
                                    </div>
                                    <div className="api-usage-member-card__controls flex flex-none items-start justify-space-between gap-5 w-full md:w-auto md:items-center md:justify-start">
                                        <div className="api-usage-member-card__total flex flex-column items-start gap-0.5 md:items-end">
                                            <small>{c('collider_2025: Label').t`Balance used`}</small>
                                            <strong>{formatApiCurrency(member.cost * usageScale, currency)}</strong>
                                        </div>
                                        <div className="api-usage-member-card__access flex items-center gap-2">
                                            <ApiAccessToggle
                                                id={`api-access-${member.id}`}
                                                enabled={member.apiAccess}
                                                label={c('collider_2025: Action')
                                                    .t`Toggle API access for ${member.name}`}
                                                onChange={() => toggleAccess(member.id)}
                                            />
                                            <span className="api-usage-access-label">
                                                {member.apiAccess
                                                    ? c('collider_2025: Status').t`Allowed`
                                                    : c('collider_2025: Status').t`Blocked`}
                                            </span>
                                        </div>
                                        <Button
                                            icon
                                            shape="ghost"
                                            size="small"
                                            className="api-usage-member-card__expand shrink-0"
                                            aria-expanded={expandedMemberIds.has(member.id)}
                                            aria-label={
                                                expandedMemberIds.has(member.id)
                                                    ? c('collider_2025: Action')
                                                          .t`Hide usage details for ${member.name}`
                                                    : c('collider_2025: Action')
                                                          .t`Show usage details for ${member.name}`
                                            }
                                            onClick={() => toggleMemberDetails(member.id)}
                                        >
                                            <LumoIcon name="ChevronDown" size={16} />
                                        </Button>
                                    </div>
                                </header>
                                {expandedMemberIds.has(member.id) && (
                                    <div className="api-usage-member-card__models api-usage-models-grid">
                                        {(['lumo-lite', 'lumo-max'] as const).map((model) => (
                                            <div key={model} className="api-usage-model rounded-lg border border-weak">
                                                <span
                                                    className={`api-usage-model__name api-usage-model__name--${model} inline-flex`}
                                                >
                                                    {model}
                                                </span>
                                                <ApiUsageModelStats
                                                    model={model}
                                                    inputTokens={Math.round(
                                                        member.modelUsage[model].inputTokens * usageScale
                                                    )}
                                                    outputTokens={Math.round(
                                                        member.modelUsage[model].outputTokens * usageScale
                                                    )}
                                                    formattedCost={formatApiCurrency(
                                                        member.modelUsage[model].cost * usageScale,
                                                        currency
                                                    )}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                        {filteredMembers.length === 0 && (
                            <div className="api-usage-member-list__empty rounded-xl border border-weak text-center">
                                {c('collider_2025: Info').t`No members match your search.`}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const ApiUsageHeader = ({ isOrgMember }: { isOrgMember: boolean }) => (
    <header className="api-usage-dashboard-header min-w-0">
        <h2 className="api-usage-dashboard__title text-bold m-0">{c('collider_2025: Title').t`API usage & balance`}</h2>
        <p className="api-usage-dashboard__subtitle m-0 mt-1">
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
            className={`api-usage-balance-status api-usage-balance-status--${status} flex flex-nowrap items-center gap-2 rounded-lg text-sm`}
        >
            <LumoIcon name={status === 'empty' ? 'Pause' : 'TriangleAlert'} size={14} className="shrink-0" />
            {message}
        </output>
    );
};

const ApiBalanceCard = ({
    balance,
    isBalanceLoading,
    currency,
    averageDailySpend,
    monthlySpend,
    isOrgMember,
    topUpDisabled,
    onTopUp,
    canTopUp,
}: {
    balance: number | undefined;
    isBalanceLoading: boolean;
    currency: Currency;
    averageDailySpend: number;
    monthlySpend: number;
    isOrgMember: boolean;
    topUpDisabled: boolean;
    onTopUp: () => void;
    canTopUp: boolean;
}) => {
    const [balanceSettings, setBalanceSettings] = useState<ApiBalanceSettings>({
        autoTopUp: { enabled: false, amount: 50, threshold: 10 },
        spendingLimit: { enabled: true, limit: 250 },
    });
    const { autoTopUp, spendingLimit } = balanceSettings;
    const [settingsModalProps, setSettingsModalOpen, renderSettingsModal] = useModalState();

    const estimatedDays =
        balance !== undefined && averageDailySpend > 0 ? Math.floor(balance / averageDailySpend) : null;
    const limitUsagePercent = spendingLimit.limit > 0 ? Math.round((monthlySpend / spendingLimit.limit) * 100) : 0;
    const isOverLimit = spendingLimit.enabled && monthlySpend >= spendingLimit.limit;
    const formattedSpend = formatApiCurrency(monthlySpend, currency);
    const formattedLimit = formatApiCurrency(spendingLimit.limit, currency);

    return (
        <section
            className="api-usage-balance-card flex flex-column rounded-xl border border-weak bg-norm overflow-hidden"
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
                            <small className="color-weak">
                                {isBalanceLoading
                                    ? c('collider_2025: Info').t`Loading balance…`
                                    : c('collider_2025: Info').t`Balance unavailable`}
                            </small>
                        ) : (
                            <>
                                <Price currency={currency} className="api-usage-balance-amount">
                                    {toCurrencyBaseUnits(balance, currency)}
                                </Price>
                                <small className="color-weak">
                                    {estimatedDays === null
                                        ? c('collider_2025: Info').t`Usage estimate unavailable`
                                        : estimatedDays === 0
                                          ? c('collider_2025: Info').t`Less than one day left at current usage`
                                          : c('collider_2025: Info')
                                                .t`About ${estimatedDays} days left at current usage`}
                                </small>
                            </>
                        )}
                    </div>
                    {canTopUp && (
                        <Button color="norm" className="shrink-0" disabled={topUpDisabled} onClick={onTopUp}>
                            {c('collider_2025: Action').t`Top up balance`}
                        </Button>
                    )}
                </div>
                {balance !== undefined && <ApiBalanceStatusMessage balance={balance} isOrgMember={isOrgMember} />}
            </div>

            {!isOrgMember && (
                <div className="api-usage-balance-card__settings api-usage-balance-row flex flex-nowrap items-center gap-4">
                    <span className="api-usage-balance-row__icon relative flex flex-none items-center justify-center rounded-lg">
                        <LumoIcon name="RefreshCw" size={18} />
                        {autoTopUp.enabled && (
                            <span className="api-usage-balance-row__badge absolute flex items-center justify-center rounded-full">
                                <LumoIcon name="Check" size={10} strokeWidth={3} />
                            </span>
                        )}
                    </span>
                    <div className="flex flex-column gap-1 flex-1 min-w-0">
                        <strong className="color-norm">
                            {autoTopUp.enabled
                                ? c('collider_2025: Title').t`Automatic top-up enabled`
                                : c('collider_2025: Title').t`Automatic top-up off`}
                        </strong>
                        <span className="text-sm color-weak">
                            {autoTopUp.enabled
                                ? getAutoTopUpSummary(autoTopUp, currency)
                                : c('collider_2025: Info').t`Keep API requests running when your balance gets low.`}
                        </span>
                        <span className={clsx('text-sm', isOverLimit ? 'color-danger text-semibold' : 'color-weak')}>
                            {(() => {
                                if (!spendingLimit.enabled) {
                                    return c('collider_2025: Info').t`No monthly spending limit`;
                                }
                                if (isOverLimit) {
                                    return c('collider_2025: Info')
                                        .t`Monthly spending limit reached. API requests are paused until next month.`;
                                }
                                return c('collider_2025: Info')
                                    .t`Monthly spending limit: ${formattedSpend} of ${formattedLimit} used (${limitUsagePercent}%)`;
                            })()}
                        </span>
                    </div>
                    <Button
                        color="weak"
                        className="shrink-0"
                        aria-label={c('collider_2025: Action').t`Manage automatic top-up and spending limit`}
                        onClick={() => setSettingsModalOpen(true)}
                    >
                        {c('collider_2025: Action').t`Manage`}
                    </Button>
                </div>
            )}

            {renderSettingsModal && (
                <ApiBalanceSettingsModal
                    {...settingsModalProps}
                    settings={balanceSettings}
                    currency={currency}
                    monthlySpend={monthlySpend}
                    onSave={setBalanceSettings}
                />
            )}
        </section>
    );
};

export const ApiUsageDashboard = ({ isOrgAdmin, isOrgMember }: { isOrgAdmin: boolean; isOrgMember: boolean }) => {
    const { APP_NAME } = useConfig();
    const [{ Currency }] = useUser();
    const [subscription] = useSubscription();
    const [paymentStatus, paymentStatusLoading] = usePaymentStatus();
    const lumoCredits = useLumoCredits();
    const [creditModalProps, setCreditModalOpen, renderCreditModal] = useModalState();
    const canTopUp = useCanBuyLumoCredits();
    const creditBalanceOverride = useDebugApiCreditBalance();
    const emptyUsageEnabled = useDebugApiEmptyUsage();
    const displayedCreditBalance = creditBalanceOverride ?? lumoCredits.balance;
    const hasCredits = displayedCreditBalance !== undefined && displayedCreditBalance > 0;
    const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>('last-30-days');
    const mockUsageDays = useMemo(() => getMockApiUsageDays(90), []);
    const allUsageDays = emptyUsageEnabled ? [] : mockUsageDays;
    const usageDays = useMemo(() => {
        if (usagePeriod === 'last-7-days') {
            return allUsageDays.slice(-7);
        }
        if (usagePeriod === 'previous-30-days') {
            return allUsageDays.slice(-60, -30);
        }
        if (usagePeriod === 'last-90-days') {
            return allUsageDays;
        }
        return allUsageDays.slice(-30);
    }, [allUsageDays, usagePeriod]);
    const periodLabel = {
        'last-7-days': c('collider_2025: Date range').t`Last 7 days`,
        'last-30-days': c('collider_2025: Date range').t`Last 30 days`,
        'previous-30-days': c('collider_2025: Date range').t`Previous 30 days`,
        'last-90-days': c('collider_2025: Date range').t`Last 90 days`,
    }[usagePeriod];
    const sumTokens = (days: ApiUsageDay[]) =>
        days.reduce((total, day) => total + day.inputTokens + day.outputTokens, 0);
    const baselineTokens = sumTokens(allUsageDays.slice(-30));
    const usageScale = baselineTokens > 0 ? sumTokens(usageDays) / baselineTokens : 0;
    const recentUsageDays = allUsageDays.slice(-30);
    const monthlySpend = recentUsageDays.reduce((total, day) => total + day.cost, 0);
    const averageDailySpend = recentUsageDays.length > 0 ? monthlySpend / recentUsageDays.length : 0;

    return (
        <section
            className="api-usage-dashboard flex flex-column gap-4 w-full min-w-0"
            aria-label={c('collider_2025: Title').t`API usage dashboard`}
        >
            <ApiUsageHeader isOrgMember={isOrgMember} />
            <div className="api-usage-account-grid">
                <ApiBalanceCard
                    balance={displayedCreditBalance}
                    isBalanceLoading={lumoCredits.loading}
                    currency={subscription?.Currency ?? Currency}
                    averageDailySpend={averageDailySpend}
                    monthlySpend={monthlySpend}
                    isOrgMember={isOrgMember}
                    topUpDisabled={paymentStatusLoading || !paymentStatus}
                    onTopUp={() => setCreditModalOpen(true)}
                    canTopUp={canTopUp}
                />
                <ApiPayAsYouGoCard />
            </div>

            <section className="api-usage-overview-section w-full min-w-0 bg-norm rounded-xl border border-weak">
                <div className="api-usage-period-row flex flex-column items-stretch justify-space-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h3 className="text-lg text-semibold color-norm m-0">{c('collider_2025: Title').t`Usage`}</h3>
                        <p className="text-sm color-weak m-0 mt-1">
                            {c('collider_2025: Info').t`Review token usage and balance deductions over time.`}
                        </p>
                    </div>
                    <div className="api-usage-period-actions flex flex-nowrap items-center gap-2">
                        <Button
                            color="weak"
                            className="flex flex-nowrap items-center gap-2 shrink-0"
                            disabled={usageDays.length === 0}
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
                <ApiUsageOverview days={usageDays} currency={Currency} />
            </section>

            {isOrgAdmin && (
                <section className="api-usage-members-section w-full min-w-0 bg-norm rounded-xl border border-weak">
                    <ApiUsageMembers
                        hasCredits={hasCredits}
                        periodLabel={periodLabel}
                        usageScale={usageScale}
                        currency={Currency}
                    />
                </section>
            )}

            {canTopUp && renderCreditModal && paymentStatus && (
                <LumoCreditsModal app={APP_NAME} paymentStatus={paymentStatus} {...creditModalProps} />
            )}
        </section>
    );
};
