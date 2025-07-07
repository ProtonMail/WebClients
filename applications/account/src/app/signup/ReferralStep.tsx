import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { Button, CircleLoader, Tooltip } from '@proton/atoms';
import { ReferralFeaturesListLegacy, useConfig } from '@proton/components';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import {
    type BillingAddress,
    CYCLE,
    DEFAULT_CURRENCY,
    DEFAULT_TAX_BILLING_ADDRESS,
    PLANS,
    PLAN_NAMES,
    type PaymentsApi,
    paymentStatusToBillingAddress,
} from '@proton/payments';
import { TaxCountrySelector, useTaxCountry } from '@proton/payments/ui';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import { getSignupApplication } from './helper';
import type { SubscriptionData } from './interfaces';

type PlanType = 'free' | 'trial';

interface Props {
    paymentsApi: PaymentsApi;
    onSubscriptionData: (subscriptionData: Pick<SubscriptionData, 'planIDs' | 'billingAddress'>) => Promise<void>;
    onBack?: () => void;
}

const ReferralStep = ({ paymentsApi, onSubscriptionData, onBack }: Props) => {
    const { APP_NAME } = useConfig();
    const [type, setType] = useState<PlanType | undefined>(undefined);
    const [loading, withLoading] = useLoading();
    const plan = PLANS.MAIL;
    const [status, statusLoading] = usePaymentStatus();

    const [billingAddress, setBillingAddress] = useState<BillingAddress>(DEFAULT_TAX_BILLING_ADDRESS);

    const [loadingCheck, withLoadingCheck] = useLoading();
    const [zipCodeBackendValid, setZipCodeBackendValid] = useState(true);

    const onBillingAddressChange = (newBillingAddress: BillingAddress) => {
        void withLoadingCheck(async () => {
            setBillingAddress(newBillingAddress);

            try {
                await paymentsApi.checkWithAutomaticVersion({
                    Plans: {
                        [plan]: 1,
                    },
                    Currency: DEFAULT_CURRENCY,
                    Cycle: CYCLE.MONTHLY,
                    BillingAddress: newBillingAddress,
                });
                setZipCodeBackendValid(true);
            } catch (error) {
                if (error instanceof InvalidZipCodeError) {
                    setZipCodeBackendValid(false);
                }
            }
        });
    };

    const taxCountry = useTaxCountry({
        statusExtended: status,
        onBillingAddressChange,
        zipCodeBackendValid,
    });

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'referral',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    useEffect(() => {
        if (!statusLoading && status) {
            onBillingAddressChange(paymentStatusToBillingAddress(status));
        }
    }, [statusLoading]);

    const mailPlus = PLAN_NAMES[plan];
    return (
        <Main>
            <Header title={c('Heading in trial plan').t`Try the best of ${MAIL_APP_NAME} for free`} onBack={onBack} />
            <Content>
                <Text>
                    {c('Baseline in trial plan')
                        .t`${mailPlus}: the privacy-first Mail and Calendar solution for your everyday communications needs.`}
                </Text>
                <ReferralFeaturesListLegacy />
                <div className="text-center mb-2">
                    {statusLoading ? (
                        <CircleLoader className="color-primary" size="small" />
                    ) : (
                        <TaxCountrySelector {...taxCountry} />
                    )}
                </div>
                <Tooltip title={taxCountry.billingAddressErrorMessage} originalPlacement="bottom">
                    {/* div is needed to enable the tooltip even if the button element is disabled */}
                    <div>
                        <Button
                            loading={loading && type === 'trial'}
                            disabled={loading || statusLoading || loadingCheck || !taxCountry.billingAddressValid}
                            color="norm"
                            shape="solid"
                            size="large"
                            className="mb-2"
                            onClick={() => {
                                setType('trial');
                                void withLoading(
                                    onSubscriptionData({
                                        planIDs: { [plan]: 1 },
                                        billingAddress,
                                    })
                                );
                            }}
                            fullWidth
                        >{c('Action in trial plan').t`Try free for 30 days`}</Button>
                    </div>
                </Tooltip>
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
