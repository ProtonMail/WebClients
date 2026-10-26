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

import { formatApiCurrency, parseApiAmount } from './apiKeysHelpers';

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
                <strong className="color-norm">{title}</strong>
                <span className="text-sm color-weak">{description}</span>
            </label>
            <Toggle
                id={id}
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="shrink-0 mt-0.5"
            />
        </div>
        {checked && <div className="api-usage-settings-fields mt-4">{children}</div>}
    </section>
);

const AmountField = ({
    id,
    label,
    value,
    onValue,
    currency,
    invalid,
}: {
    id: string;
    label: string;
    value: string;
    onValue: (value: string) => void;
    currency: Currency;
    invalid: boolean;
}) => (
    <div className="api-usage-settings-field">
        <label htmlFor={id}>{label}</label>
        <Input
            id={id}
            type="number"
            min="0"
            step="1"
            value={value}
            onValue={onValue}
            prefix={<span className="color-weak text-sm">{currency}</span>}
            error={invalid}
        />
    </div>
);

interface Props extends ModalStateProps {
    settings: ApiBalanceSettings;
    currency: Currency;
    monthlySpend: number;
    onSave: (settings: ApiBalanceSettings) => void;
}

export const ApiBalanceSettingsModal = ({ settings, currency, monthlySpend, onSave, ...modalProps }: Props) => {
    const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(settings.autoTopUp.enabled);
    const [amount, setAmount] = useState(String(settings.autoTopUp.amount));
    const [threshold, setThreshold] = useState(String(settings.autoTopUp.threshold));
    const [limitEnabled, setLimitEnabled] = useState(settings.spendingLimit.enabled);
    const [limit, setLimit] = useState(String(settings.spendingLimit.limit));

    const parsedAmount = parseApiAmount(amount);
    const parsedThreshold = parseApiAmount(threshold);
    const parsedLimit = parseApiAmount(limit);
    const isAmountValid = parsedAmount !== null && parsedAmount > 0;
    const isThresholdValid = parsedThreshold !== null;
    const isLimitValid = parsedLimit !== null && parsedLimit > 0;
    const isAutoTopUpValid = !autoTopUpEnabled || (isAmountValid && isThresholdValid);
    const isLimitSettingValid = !limitEnabled || isLimitValid;
    const isValid = isAutoTopUpValid && isLimitSettingValid;

    const formattedSpend = formatApiCurrency(monthlySpend, currency);
    const formattedLimit = isLimitValid ? formatApiCurrency(parsedLimit, currency) : '';

    const handleSave = () => {
        if (!isValid) {
            return;
        }
        onSave({
            autoTopUp: {
                enabled: autoTopUpEnabled,
                amount: isAmountValid ? parsedAmount : settings.autoTopUp.amount,
                threshold: isThresholdValid ? parsedThreshold : settings.autoTopUp.threshold,
            },
            spendingLimit: {
                enabled: limitEnabled,
                limit: isLimitValid ? parsedLimit : settings.spendingLimit.limit,
            },
        });
        modalProps.onClose?.();
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
                    <AmountField
                        id="api-auto-top-up-amount"
                        label={c('collider_2025: Label').t`Top up by`}
                        value={amount}
                        onValue={setAmount}
                        currency={currency}
                        invalid={!isAmountValid}
                    />
                    {isAmountValid && isThresholdValid && (
                        <p className="api-usage-settings-summary m-0 text-sm">
                            {getAutoTopUpSummary({ amount: parsedAmount, threshold: parsedThreshold }, currency)}
                        </p>
                    )}
                </SettingSection>

                <hr className="my-6" />

                <SettingSection
                    id="api-spending-limit-enabled"
                    checked={limitEnabled}
                    onChange={setLimitEnabled}
                    title={c('collider_2025: Label').t`Monthly spending limit`}
                    description={c('collider_2025: Info').t`Pause API requests until next month once this is reached.`}
                >
                    <AmountField
                        id="api-spending-limit-amount"
                        label={c('collider_2025: Label').t`Limit`}
                        value={limit}
                        onValue={setLimit}
                        currency={currency}
                        invalid={!isLimitValid}
                    />
                    {isLimitValid && (
                        <p className="api-usage-settings-summary m-0 text-sm">
                            {c('collider_2025: Info').t`${formattedSpend} of ${formattedLimit} used this month`}
                        </p>
                    )}
                </SettingSection>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" onClick={modalProps.onClose}>
                    {c('collider_2025: Action').t`Cancel`}
                </Button>
                <Button color="norm" disabled={!isValid} onClick={handleSave}>
                    {c('collider_2025: Action').t`Save settings`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
