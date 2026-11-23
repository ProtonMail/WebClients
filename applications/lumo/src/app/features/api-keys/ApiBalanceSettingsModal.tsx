import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { Currency } from '@proton/payments/core/interface';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { formatApiCurrency, parseApiAmount } from './apiKeysHelpers';

const MIN_AUTO_TOP_UP_AMOUNT = 25;
const MAX_AUTO_TOP_UP_AMOUNT = 100;
const MIN_AUTO_TOP_UP_THRESHOLD = 1;
const NOT_PRIMARY_ADMIN_CODE = 2011;
const MISSING_SCOPE_CODE = 9100;
const ACTIVE_OPERATION_CODE = 2502;

const getAmountRangeMessage = (currency: Currency) => {
    const formattedMinAmount = formatApiCurrency(MIN_AUTO_TOP_UP_AMOUNT, currency);
    const formattedMaxAmount = formatApiCurrency(MAX_AUTO_TOP_UP_AMOUNT, currency);
    return c('collider_2025: Error')
        .t`Top-up amount must be a whole amount between ${formattedMinAmount} and ${formattedMaxAmount}`;
};

const getThresholdRangeMessage = (amount: number, currency: Currency) => {
    const formattedMinThreshold = formatApiCurrency(MIN_AUTO_TOP_UP_THRESHOLD, currency);
    const formattedMaxThreshold = formatApiCurrency(amount - 1, currency);
    return c('collider_2025: Error')
        .t`Threshold must be a whole amount between ${formattedMinThreshold} and ${formattedMaxThreshold}`;
};

const isSectionChanged = <Section extends { enabled: boolean }>(
    opened: Section,
    edited: Section,
    valueKeys: (keyof Section)[]
) => opened.enabled !== edited.enabled || (edited.enabled && valueKeys.some((key) => opened[key] !== edited[key]));

interface ApiAutoTopUpSettings {
    enabled: boolean;
    amount: number;
    threshold: number;
}

interface ApiSpendingLimitSettings {
    enabled: boolean;
    limit: number;
}

export interface ApiBalanceSettings {
    autoTopUp: ApiAutoTopUpSettings;
    spendingLimit: ApiSpendingLimitSettings;
}

export const getAutoTopUpSummary = (
    { amount, threshold }: Pick<ApiAutoTopUpSettings, 'amount' | 'threshold'>,
    currency: Currency
) => {
    const formattedAmount = formatApiCurrency(amount, currency);
    const formattedThreshold = formatApiCurrency(threshold, currency);
    return c('collider_2025: Info').t`Adding ${formattedAmount} when your balance falls below ${formattedThreshold}`;
};

/** Mirrors the backend: it tops up at or below the threshold unless the monthly spending limit would be exceeded. */
export const getImmediateTopUpWarning = ({
    balance,
    amount,
    threshold,
    spent,
    spendingLimit,
    currency,
}: {
    balance: number;
    amount: number;
    threshold: number;
    spent: number;
    spendingLimit: number | undefined;
    currency: Currency;
}) => {
    if (balance > threshold || (spendingLimit !== undefined && spent + amount > spendingLimit)) {
        return;
    }
    const formattedBalance = formatApiCurrency(balance, currency);
    const formattedAmount = formatApiCurrency(amount, currency);
    return c('collider_2025: Warning')
        .t`Your balance of ${formattedBalance} has reached the threshold, so saving will top up ${formattedAmount} right away.`;
};

const SettingSection = ({
    id,
    checked,
    onChange,
    title,
    description,
    children,
}: {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    title: string;
    description: string;
    children: ReactNode;
}) => (
    <section className="api-usage-settings-section">
        <div className="flex flex-nowrap items-start justify-space-between gap-4">
            <label htmlFor={id} className="flex flex-column gap-1">
                <strong className="lumo-color-glyph">{title}</strong>
                <span className="lumo-body-small lumo-color-glyph-mid">{description}</span>
            </label>
            <Toggle
                id={id}
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="shrink-0 mt-0.5"
            />
        </div>
        {checked && <div className="api-usage-settings-fields gap-3 mt-4">{children}</div>}
    </section>
);

const AmountField = ({
    id,
    label,
    value,
    onValue,
    currency,
    invalid = false,
}: {
    id: string;
    label: string;
    value: string;
    onValue?: (value: string) => void;
    currency: Currency;
    invalid?: boolean;
}) => (
    <div className="api-usage-settings-field lumo-body-medium lumo-color-glyph">
        <label htmlFor={id}>{label}</label>
        <Input
            id={id}
            type="number"
            min="0"
            step="1"
            value={value}
            onValue={onValue}
            prefix={<span className="lumo-body-small lumo-color-glyph-mid">{currency}</span>}
            error={invalid}
        />
    </div>
);

const getSaveErrorMessage = (error: unknown) => {
    const { status, code } = getApiError(error);
    if (code === NOT_PRIMARY_ADMIN_CODE || (status === 403 && code === MISSING_SCOPE_CODE)) {
        return c('collider_2025: Error').t`Only the organization's primary admin can change these settings.`;
    }
    if (code === ACTIVE_OPERATION_CODE) {
        return c('collider_2025: Error').t`A top-up is already in progress. Try again in a minute.`;
    }
    return c('collider_2025: Error').t`Automatic top-up could not be saved. Please try again.`;
};

interface Props extends ModalStateProps {
    settings: ApiBalanceSettings;
    currency: Currency;
    balance?: number;
    spent: number;
    canChargeAutoTopUp: boolean;
    onSave: (settings: ApiBalanceSettings) => Promise<void>;
}

export const ApiBalanceSettingsModal = ({
    settings,
    currency,
    balance,
    spent,
    canChargeAutoTopUp,
    onSave,
    ...modalProps
}: Props) => {
    const [openedSettings] = useState(settings);
    const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(openedSettings.autoTopUp.enabled);
    const [amount, setAmount] = useState(String(openedSettings.autoTopUp.amount));
    const [threshold, setThreshold] = useState(String(openedSettings.autoTopUp.threshold));
    const [limitEnabled, setLimitEnabled] = useState(openedSettings.spendingLimit.enabled);
    const [limit, setLimit] = useState(String(openedSettings.spendingLimit.limit));
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<unknown>();

    const parsedAmount = parseApiAmount(amount);
    const parsedThreshold = parseApiAmount(threshold);
    const parsedLimit = parseApiAmount(limit);
    const isAmountValid =
        parsedAmount !== null &&
        Number.isInteger(parsedAmount) &&
        parsedAmount >= MIN_AUTO_TOP_UP_AMOUNT &&
        parsedAmount <= MAX_AUTO_TOP_UP_AMOUNT;
    const savedAmount = isAmountValid ? parsedAmount : openedSettings.autoTopUp.amount;
    const isThresholdValid =
        parsedThreshold !== null &&
        Number.isInteger(parsedThreshold) &&
        parsedThreshold >= MIN_AUTO_TOP_UP_THRESHOLD &&
        parsedThreshold < savedAmount;
    const savedThreshold = isThresholdValid ? parsedThreshold : openedSettings.autoTopUp.threshold;
    const isLimitValid = parsedLimit !== null && Number.isInteger(parsedLimit) && parsedLimit >= savedAmount;
    const isAutoTopUpValid =
        !autoTopUpEnabled || (isAmountValid && isThresholdValid && (!limitEnabled || isLimitValid));

    const formattedSpent = formatApiCurrency(spent, currency);
    const formattedLimit = isLimitValid ? formatApiCurrency(parsedLimit, currency) : '';
    const formattedSavedAmount = formatApiCurrency(savedAmount, currency);
    const savesAutoTopUpChange =
        !openedSettings.autoTopUp.enabled ||
        savedAmount !== openedSettings.autoTopUp.amount ||
        savedThreshold !== openedSettings.autoTopUp.threshold;
    const immediateTopUpWarning =
        autoTopUpEnabled && isAutoTopUpValid && canChargeAutoTopUp && savesAutoTopUpChange && balance !== undefined
            ? getImmediateTopUpWarning({
                  balance,
                  amount: savedAmount,
                  threshold: savedThreshold,
                  spent,
                  spendingLimit: limitEnabled && parsedLimit !== null ? parsedLimit : undefined,
                  currency,
              })
            : undefined;

    const handleSave = async () => {
        if (!isAutoTopUpValid) {
            return;
        }
        const edited = autoTopUpEnabled
            ? {
                  autoTopUp: { enabled: true, amount: savedAmount, threshold: savedThreshold },
                  spendingLimit: {
                      enabled: limitEnabled,
                      limit: isLimitValid ? parsedLimit : openedSettings.spendingLimit.limit,
                  },
              }
            : { ...openedSettings, autoTopUp: { ...openedSettings.autoTopUp, enabled: false } };
        const hasChanges =
            isSectionChanged(openedSettings.autoTopUp, edited.autoTopUp, ['amount', 'threshold']) ||
            isSectionChanged(openedSettings.spendingLimit, edited.spendingLimit, ['limit']);
        if (!hasChanges) {
            modalProps.onClose?.();
            return;
        }
        setSaving(true);
        setSaveError(undefined);
        try {
            await onSave(edited);
            modalProps.onClose?.();
        } catch (error) {
            setSaveError(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalTwo {...modalProps} size="medium">
            <ModalTwoHeader title={c('collider_2025: Title').t`Balance settings`} />
            <ModalTwoContent>
                <SettingSection
                    id="api-auto-top-up-enabled"
                    checked={autoTopUpEnabled}
                    onChange={setAutoTopUpEnabled}
                    title={c('collider_2025: Label').t`Automatic top-up`}
                    description={c('collider_2025: Info')
                        .t`Top up from your default payment method when your balance runs low.`}
                >
                    <AmountField
                        id="api-auto-top-up-threshold"
                        label={c('collider_2025: Label').t`When balance falls below`}
                        value={threshold}
                        onValue={setThreshold}
                        currency={currency}
                        invalid={!isThresholdValid}
                    />
                    {!isThresholdValid && (
                        <p className="m-0 lumo-body-small lumo-color-signal-danger">
                            {getThresholdRangeMessage(savedAmount, currency)}
                        </p>
                    )}
                    <AmountField
                        id="api-auto-top-up-amount"
                        label={c('collider_2025: Label').t`Top up by`}
                        value={amount}
                        onValue={setAmount}
                        currency={currency}
                        invalid={!isAmountValid}
                    />
                    {isAmountValid && isThresholdValid && (
                        <p className="api-usage-settings-summary py-2.5 m-0 radius-8 lumo-body-small lumo-color-glyph-brand-text lumo-bg-control-fill">
                            {getAutoTopUpSummary({ amount: parsedAmount, threshold: parsedThreshold }, currency)}
                        </p>
                    )}
                    {!isAmountValid && (
                        <p className="m-0 lumo-body-small lumo-color-signal-danger">
                            {getAmountRangeMessage(currency)}
                        </p>
                    )}
                    {!canChargeAutoTopUp && (
                        <p className="m-0 lumo-body-small lumo-color-signal-warning">
                            {c('collider_2025: Warning')
                                .t`Automatic top-up needs a card or PayPal set as default payment method with automatic payments on.`}
                        </p>
                    )}

                    <SettingSection
                        id="api-spending-limit-enabled"
                        checked={limitEnabled}
                        onChange={setLimitEnabled}
                        title={c('collider_2025: Label').t`Monthly spending limit`}
                        description={c('collider_2025: Info')
                            .t`Pause automatic top-ups until next month once they reach this amount.`}
                    >
                        <AmountField
                            id="api-spending-limit-amount"
                            label={c('collider_2025: Label').t`Limit`}
                            value={limit}
                            onValue={setLimit}
                            currency={currency}
                            invalid={!isLimitValid}
                        />
                        {isLimitValid ? (
                            <p className="api-usage-settings-summary py-2.5 m-0 radius-8 lumo-body-small lumo-color-glyph-brand-text lumo-bg-control-fill">
                                {c('collider_2025: Info')
                                    .t`${formattedSpent} of ${formattedLimit} bought automatically this month`}
                            </p>
                        ) : (
                            <p className="m-0 lumo-body-small lumo-color-signal-danger">
                                {c('collider_2025: Error')
                                    .t`Limit must be a whole amount of at least ${formattedSavedAmount}`}
                            </p>
                        )}
                    </SettingSection>
                </SettingSection>
                {immediateTopUpWarning && <p className="m-0 mt-4 text-sm color-warning">{immediateTopUpWarning}</p>}
                {saveError !== undefined && (
                    <p className="m-0 mt-4 lumo-body-small lumo-color-signal-danger">
                        {getSaveErrorMessage(saveError)}
                    </p>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" onClick={modalProps.onClose}>
                    {c('collider_2025: Action').t`Cancel`}
                </Button>
                <Button color="norm" disabled={!isAutoTopUpValid} loading={saving} onClick={handleSave}>
                    {c('collider_2025: Action').t`Save settings`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
