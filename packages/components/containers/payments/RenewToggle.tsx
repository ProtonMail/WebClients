import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Autopay } from '@proton/components/payments/core';
import { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';

import { PrimaryButton } from '../../components/button';
import { ModalProps } from '../../components/modalTwo';
import { useModalTwo } from '../../components/modalTwo/useModalTwo';
import { Prompt } from '../../components/prompt';
import { Toggle } from '../../components/toggle';
import { useSubscription } from '../../hooks';

type DisableRenewModalOwnProps = { isVPNPlan: boolean };
type DisableRenewModalPromiseProps = { onResolve: (result: boolean) => void };
type DisableRenewModalProps = ModalProps & DisableRenewModalPromiseProps & DisableRenewModalOwnProps;

export const DisableRenewModal = ({ isVPNPlan, onResolve, ...rest }: DisableRenewModalProps) => {
    return (
        <Prompt
            data-testid="disable-renew-modal"
            title={c('Subscription renewal state').t`Are you sure?`}
            buttons={[
                <Button data-testid="action-disable-autopay" onClick={() => onResolve(true)}>{c(
                    'Subscription renewal state'
                ).t`Disable`}</Button>,
                <PrimaryButton data-testid="action-keep-autopay" onClick={() => onResolve(false)}>{c(
                    'Subscription renewal state'
                ).t`Keep auto-pay`}</PrimaryButton>,
            ]}
            {...rest}
        >
            <p>
                {isVPNPlan
                    ? c('Subscription renewal state')
                          .t`Our system will no longer auto-charge you using this payment method, but your subscription will still renew at the end of the billing cycle. If you want to downgrade or change your subscription, you still need to do that yourself before the end of the billing period. Furthermore, if you forget to make a manual payment and auto-pay is disabled for all payment methods, we may auto-downgrade your account which will lead to the loss of many features.`
                    : c('Subscription renewal state')
                          .t`Our system will no longer auto-charge you using this payment method, but your subscription will still renew at the end of the billing cycle. If you want to downgrade or change your subscription, you still need to do that yourself before the end of the billing period. We cannot auto-downgrade you because if you are over free plan storage quota or using other paid features, we cannot auto delete files, emails, or other data for you. If you disable automatic payment, remember to pay your next subscription invoice before the due date to prevent account suspension.`}
            </p>
        </Prompt>
    );
};

export interface UseRenewToggleOptions {
    initialRenewState?: Autopay;
}

export interface UseRenewToggleResult {
    onChange: () => Promise<Autopay | null>;
    disableRenewModal: JSX.Element | null;
    renewState: Autopay;
    setRenewState: (newState: Autopay) => void;
}

export const useRenewToggle = ({ initialRenewState = Autopay.ENABLE }: UseRenewToggleOptions): UseRenewToggleResult => {
    const [subscription] = useSubscription();
    const vpnPlans: (PLANS | ADDON_NAMES)[] = [PLANS.VPN, PLANS.VPNBASIC, PLANS.VPNPLUS];
    const isVPNPlan = subscription?.Plans?.some(({ Name }) => vpnPlans.includes(Name));

    const [disableRenewModal, showDisableRenewModal] = useModalTwo<DisableRenewModalOwnProps, boolean>(
        DisableRenewModal
    );

    const [renewState, setRenewState] = useState(initialRenewState);
    const onChange = async (): Promise<Autopay | null> => {
        let newState: Autopay;
        if (renewState === Autopay.ENABLE) {
            const userDecidedDisable = await showDisableRenewModal({ isVPNPlan });
            if (!userDecidedDisable) {
                return null;
            }

            newState = Autopay.DISABLE;
        } else {
            newState = Autopay.ENABLE;
        }

        setRenewState(newState);
        return newState;
    };

    return { onChange, disableRenewModal, renewState, setRenewState };
};

export type Props = {
    loading?: boolean;
    onChange: () => any;
} & Pick<UseRenewToggleResult, 'renewState' | 'disableRenewModal'>;

const RenewToggle = ({ renewState, onChange, disableRenewModal, loading }: Props) => {
    const toggleId = 'toggle-subscription-renew';
    const checked = renewState === Autopay.ENABLE;

    return (
        <>
            {disableRenewModal}
            <div className="flex flex-justify-space-between mx-2">
                <label htmlFor={toggleId}>
                    <span>{c('Subscription renewal state').t`Enable auto-pay support`}</span>
                </label>
                <Toggle
                    id={toggleId}
                    checked={checked}
                    onChange={onChange}
                    loading={loading}
                    data-testid="toggle-subscription-renew"
                />
            </div>
        </>
    );
};

export default RenewToggle;
