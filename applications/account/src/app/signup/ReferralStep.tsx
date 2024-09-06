import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { ReferralFeaturesList, useConfig } from '@proton/components';
import { WrappedTaxCountrySelector } from '@proton/components/containers/payments/TaxCountrySelector';
import {
    type BillingAddress,
    DEFAULT_TAX_BILLING_ADDRESS,
    type PaymentMethodStatusExtended,
} from '@proton/components/payments/core';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { MAIL_APP_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import { getSignupApplication } from './helper';
import type { SubscriptionData } from './interfaces';

type PlanType = 'free' | 'trial';

interface Props {
    onSubscriptionData: (subscriptionData: Pick<SubscriptionData, 'planIDs' | 'billingAddress'>) => Promise<void>;
    onBack?: () => void;
}

const usePaymentsStatus = () => {
    const paymentsApi = usePaymentsApi();

    const [status, setStatus] = useState<PaymentMethodStatusExtended | undefined>();
    const [statusLoading, withStatusLoading] = useLoading();

    useEffect(() => {
        void withStatusLoading(async () => {
            const status = await paymentsApi.paymentsApi.statusExtendedAutomatic();
            setStatus(status);
        });
    }, []);

    return {
        statusLoading,
        status,
    };
};

const ReferralStep = ({ onSubscriptionData, onBack }: Props) => {
    const { APP_NAME } = useConfig();
    const [type, setType] = useState<PlanType | undefined>(undefined);
    const [loading, withLoading] = useLoading();
    const mailPlus = PLAN_NAMES[PLANS.MAIL];
    const { status, statusLoading } = usePaymentsStatus();
    const [billingAddress, setBillingAddress] = useState<BillingAddress>(DEFAULT_TAX_BILLING_ADDRESS);

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'referral',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    return (
        <Main>
            <Header title={c('Heading in trial plan').t`Try the best of ${MAIL_APP_NAME} for free`} onBack={onBack} />
            <Content>
                <Text>
                    {c('Baseline in trial plan')
                        .t`${mailPlus}: the privacy-first Mail and Calendar solution for your everyday communications needs.`}
                </Text>
                <ReferralFeaturesList />
                <div className="text-center mb-2">
                    {statusLoading ? (
                        <CircleLoader className="color-primary" size="small" />
                    ) : (
                        <WrappedTaxCountrySelector
                            statusExtended={status ?? DEFAULT_TAX_BILLING_ADDRESS}
                            onBillingAddressChange={(newBillingAddress) => setBillingAddress(newBillingAddress)}
                        />
                    )}
                </div>
                <Button
                    loading={loading && type === 'trial'}
                    disabled={loading || statusLoading}
                    color="norm"
                    shape="solid"
                    size="large"
                    className="mb-2"
                    onClick={() => {
                        setType('trial');
                        void withLoading(
                            onSubscriptionData({
                                planIDs: { [PLANS.MAIL]: 1 },
                                billingAddress,
                            })
                        );
                    }}
                    fullWidth
                >{c('Action in trial plan').t`Try free for 30 days`}</Button>
                <p className="text-center mt-0 mb-2">
                    <small className="color-weak">{c('Info').t`No credit card required`}</small>
                </p>
                <Button
                    loading={loading && type === 'free'}
                    disabled={loading}
                    size="large"
                    color="norm"
                    shape="ghost"
                    onClick={() => {
                        setType('free');
                        void withLoading(
                            onSubscriptionData({
                                planIDs: {},
                                billingAddress,
                            })
                        );
                    }}
                    fullWidth
                >{c('Action in trial plan').t`No, thanks`}</Button>
            </Content>
        </Main>
    );
};

export default ReferralStep;
