import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { Alert3ds, useApi } from '@proton/components';
import Price from '@proton/components/components/price/Price';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { type OnChargeable, usePaymentFacade } from '@proton/components/payments/client-extensions';
import useLoading from '@proton/hooks/useLoading';
import type { BillingAddress, Currency, PaymentProcessorHook } from '@proton/payments';
import { getBillingAddressFromPaymentStatus } from '@proton/payments';
import { getMinDonationAmount } from '@proton/payments/core/amount-limits';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { normalizePostalCode } from '@proton/payments/postal-codes/format';
import { useTaxCountry } from '@proton/payments/ui';
import { PayButton } from '@proton/payments/ui/components/PayButton';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { usePaymentOptimistic } from '@proton/payments/ui/context/PaymentContextOptimistic';
import { revoke } from '@proton/shared/lib/api/auth';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import BornPrivateFeatures from '../../components/BornPrivateFeatures';
import BornPrivateFooter from '../../components/BornPrivateFooter';
import BornPrivateHeader from '../../components/BornPrivateHeader';
import BornPrivateHeading from '../../components/BornPrivateHeading';
import BornPrivateLayout from '../../components/BornPrivateLayout';
import BornPrivateMain from '../../components/BornPrivateMain';
import BornPrivateTerms from '../../components/BornPrivateTerms';
import BornPrivateFormContainer from '../../components/form/BornPrivateFormContainer';
import BornPrivateFormFooter from '../../components/form/BornPrivateFormFooter';
import BornPrivateFormHeading from '../../components/form/BornPrivateFormHeading';
import BornPrivateFormParagraph from '../../components/form/BornPrivateFormParagraph';
import type { FormData, ReservedAccount } from '../EmailReservationSignup';
import { Steps, TOTAL_STEPS } from '../EmailReservationSignup';
import DonationAmountSelect from '../components/DonationAmountSelect';
import ReservationErrorModal from '../components/ReservationErrorModal';
import { ErrorTypes, generateReadableActivationCode, getDonationCurrency } from '../helpers/emailReservationHelpers';
import {
    type AuthenticateDonationUserResult,
    authenticateDonationUser,
    captureDonationPayment,
    createDonationUser,
    setBornPrivateDetails,
} from '../helpers/emailReservationRequests';

const DEFAULT_DONATION_AMOUNT = 500;

export interface DonationPaymentData {
    paymentToken: string;
    amount: number;
    currency: Currency;
    billingAddress: BillingAddress;
}

type ApiCallStatus = 'idle' | 'pending' | 'success' | 'error';

interface DonationApiStatuses {
    createDonationUser: ApiCallStatus;
    authenticateDonationUser: ApiCallStatus;
    captureDonationPayment: ApiCallStatus;
    setBornPrivateDetails: ApiCallStatus;
}

const INITIAL_STATUSES: DonationApiStatuses = {
    createDonationUser: 'idle',
    authenticateDonationUser: 'idle',
    captureDonationPayment: 'idle',
    setBornPrivateDetails: 'idle',
};

interface DonationProps {
    formData: FormData & { reservedAccount: ReservedAccount };
    onBack: () => void;
    onDonationSuccess: (activationCode: string) => void;
}

const FLOW_ID = 'reservation-donation';

const Donation = ({ formData, onBack, onDonationSuccess }: DonationProps) => {
    const { parentEmail, reservedAccount } = formData;
    const isBornPrivateEuropeEnabled = useFlag('BornPrivateEurope');
    const { paymentStatus } = usePayments();
    const [currency, setCurrency] = useState<Currency>(
        isBornPrivateEuropeEnabled ? getDonationCurrency(paymentStatus?.CountryCode) : 'USD'
    );
    const [donationAmount, setDonationAmount] = useState(DEFAULT_DONATION_AMOUNT);
    const payments = usePaymentOptimistic();
    const [submitting, withSubmitting] = useLoading();
    const [donationProcessing, setDonationProcessing] = useState(false);
    const { options } = payments;
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorType, setErrorType] = useState<ErrorTypes | null>(null);
    const [retryBornPrivateRequest, setRetryBornPrivateRequest] = useState(false);
    const api = useApi();

    const [apiStatuses, setApiStatuses] = useState<DonationApiStatuses>(INITIAL_STATUSES);
    const activationKeyRef = useRef<string | null>(null);

    const runStep = async <T,>(key: keyof DonationApiStatuses, request: () => Promise<T>): Promise<T> => {
        setApiStatuses((prev) => ({ ...prev, [key]: 'pending' }));
        try {
            const result = await request();
            setApiStatuses((prev) => ({ ...prev, [key]: 'success' }));
            return result;
        } catch (error) {
            setApiStatuses((prev) => ({ ...prev, [key]: 'error' }));
            throw error;
        }
    };

    const runStepIfNeeded = async <T,>(
        key: keyof DonationApiStatuses,
        request: () => Promise<T>
    ): Promise<T | undefined> => {
        if (apiStatuses[key] === 'success') {
            return undefined;
        }
        return runStep(key, request);
    };

    const resetFailedRequests = () => {
        setApiStatuses((prev) => ({
            ...prev,
            authenticateDonationUser: 'idle',
            captureDonationPayment: prev.captureDonationPayment === 'error' ? 'idle' : prev.captureDonationPayment,
            setBornPrivateDetails: prev.setBornPrivateDetails === 'error' ? 'idle' : prev.setBornPrivateDetails,
        }));
    };

    const retryPostPayment = async () => {
        const activationKey = activationKeyRef.current;
        if (!activationKey) {
            return;
        }
        setDonationProcessing(true);
        try {
            const authResult = await runStep('authenticateDonationUser', () =>
                authenticateDonationUser({
                    username: reservedAccount.username,
                    domain: reservedAccount.domain,
                    password: activationKey,
                    api,
                })
            );
            const session = authResult ?? null;
            if (!session) {
                throw new Error('Authentication failed');
            }
            await runStep('setBornPrivateDetails', () =>
                setBornPrivateDetails({
                    api,
                    auth: session,
                    parentEmail,
                    activationKey,
                })
            );
            setShowErrorModal(false);
            onDonationSuccess(activationKey);
        } finally {
            setDonationProcessing(false);
        }
    };

    const onChargeable: OnChargeable = async (_, data) => {
        const paymentToken = data.chargeablePaymentParameters.PaymentToken;
        if (!paymentToken) {
            setErrorType(ErrorTypes.paymentError);
            setShowErrorModal(true);
            throw new Error('Payment token is missing');
        }

        const chargeableResult: DonationPaymentData = {
            paymentToken,
            amount: donationAmount,
            currency: currency,
            billingAddress: {
                ...options.billingAddress,
                ZipCode: options.billingAddress.ZipCode
                    ? normalizePostalCode(options.billingAddress.ZipCode, options.billingAddress.CountryCode)
                    : null,
            },
        };

        resetFailedRequests();

        const activationKey = activationKeyRef.current ?? generateReadableActivationCode();
        activationKeyRef.current = activationKey;

        let session: AuthenticateDonationUserResult;

        let errorCategory: ErrorTypes = ErrorTypes.paymentError;

        try {
            setDonationProcessing(true);

            await runStepIfNeeded('createDonationUser', () =>
                createDonationUser({
                    reservedAccount,
                    password: activationKey,
                    paymentToken: chargeableResult.paymentToken,
                    api,
                    productParam: APPS.PROTONMAIL,
                })
            );

            errorCategory = ErrorTypes.postAccountCreationError;

            const authResult = await runStep('authenticateDonationUser', () =>
                authenticateDonationUser({
                    username: reservedAccount.username,
                    domain: reservedAccount.domain,
                    password: activationKey,
                    api,
                })
            );

            session = authResult;

            let completedSuccessfully = false;
            try {
                await runStepIfNeeded('captureDonationPayment', () =>
                    captureDonationPayment({
                        paymentToken: chargeableResult.paymentToken,
                        amount: chargeableResult.amount,
                        currency: chargeableResult.currency,
                        billingAddress: chargeableResult.billingAddress,
                        api,
                        auth: session,
                        hasZipCodeValidation: false,
                    })
                );

                setRetryBornPrivateRequest(true);

                await runStepIfNeeded('setBornPrivateDetails', () =>
                    setBornPrivateDetails({
                        api,
                        auth: session,
                        parentEmail,
                        activationKey,
                    })
                );

                onDonationSuccess(activationKey);
                completedSuccessfully = true;
            } finally {
                if (session && !completedSuccessfully) {
                    await api(withAuthHeaders(session.UID, session.AccessToken, revoke())).catch(noop);
                }
            }
        } catch (error) {
            setErrorType(errorCategory);
            setShowErrorModal(true);
            throw error;
        } finally {
            setDonationProcessing(false);
        }
    };

    const paymentFacade = usePaymentFacade({
        amount: donationAmount,
        currency: currency,
        billingAddress: options.billingAddress,
        onChargeable,
        flow: FLOW_ID,
        product: APPS.PROTONMAIL,
        telemetryContext: 'ctx-email-reservation',
    });

    const taxCountry = useTaxCountry({
        onBillingAddressChange: payments.selectFullBillingAddress,
        initialBillingAddress: payments.paymentStatus
            ? getBillingAddressFromPaymentStatus(payments.paymentStatus)
            : undefined,
        paymentFacade,
        telemetryContext: payments.telemetryContext,
    });

    const validatePayment = (): boolean => {
        if (
            submitting ||
            donationProcessing ||
            !payments.initializationStatus.pricingInitialized ||
            payments.loadingPaymentDetails
        ) {
            return false;
        }
        return true;
    };

    const process = (processor: PaymentProcessorHook | undefined) => {
        if (!validatePayment()) {
            return;
        }

        async function run() {
            if (!processor) {
                return;
            }
            try {
                await processor.processPaymentToken();
            } catch (error) {
                setShowErrorModal(true);
            }
        }

        withSubmitting(run()).catch(noop);
    };

    const handleProcess = () => {
        if (retryBornPrivateRequest && activationKeyRef.current) {
            void retryPostPayment().catch(() => setShowErrorModal(true));
            return;
        }
        return process(paymentFacade.selectedProcessor);
    };

    const selectedMethodCard = paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;

    // translator: full sentence is: To prevent abuse or fraud, we ask for a small $1 donation. This supports the <Proton Foundation's> work defending digital privacy globally and helps to protect the next generation.
    const protonFoundationLink = (
        <Href href="https://proton.me/foundation" key="proton-foundation-link" className="color-inherit">{c('Link')
            .t`${BRAND_NAME} Foundation's`}</Href>
    );
    const minimumDonation = getSimplePriceString(currency, getMinDonationAmount(currency));

    return (
        <BornPrivateLayout>
            <BornPrivateHeader />
            <BornPrivateMain>
                <BornPrivateHeading />
                <BornPrivateFeatures />
                <BornPrivateFormContainer onSubmit={handleProcess}>
                    <BornPrivateFormHeading>{c('Heading')
                        .t`Donate to the ${BRAND_NAME} Foundation`}</BornPrivateFormHeading>
                    <BornPrivateFormParagraph>{
                        // translator: full sentence is: To prevent abuse or fraud, we ask for a small $1 donation. This supports the <Proton Foundation's> work defending digital privacy globally and helps to protect the next generation.
                        c('Info')
                            .jt`To prevent abuse or fraud, we ask for a minimum ${minimumDonation} donation. This supports the ${protonFoundationLink} work defending digital privacy globally and helps to protect the next generation.`
                    }</BornPrivateFormParagraph>
                    <DonationAmountSelect
                        currency={currency}
                        onCurrencyChange={setCurrency}
                        donationAmount={donationAmount}
                        setDonationAmount={setDonationAmount}
                        isSubmitting={submitting || donationProcessing}
                        showCurrencySelector={isBornPrivateEuropeEnabled}
                    />
                    <PaymentWrapper {...paymentFacade} noMaxWidth hideFirstLabel taxCountry={taxCountry} />
                    <BornPrivateFormFooter step={Steps.Donation} totalSteps={TOTAL_STEPS} stackedFullWidth>
                        <Button
                            fullWidth
                            className="rounded-lg"
                            onClick={onBack}
                            size="large"
                            disabled={
                                submitting ||
                                donationProcessing ||
                                errorType === ErrorTypes.postAccountCreationError ||
                                retryBornPrivateRequest
                            }
                        >
                            {c('Action').t`Back`}
                        </Button>

                        <div className="rounded-lg overflow-hidden w-full">
                            <PayButton
                                fullWidth
                                size="large"
                                color="norm"
                                disabled={donationAmount < getMinDonationAmount(currency)}
                                taxCountry={taxCountry}
                                paymentFacade={paymentFacade}
                                loading={submitting || donationProcessing}
                                data-testid="pay"
                                product={APPS.PROTONMAIL}
                                telemetryContext="ctx-email-reservation"
                            >
                                <span>
                                    {c('Action').t`Donate`} <Price currency={currency}>{donationAmount}</Price>
                                </span>
                            </PayButton>
                        </div>
                    </BornPrivateFormFooter>
                    <BornPrivateTerms />
                </BornPrivateFormContainer>
                {selectedMethodCard && <Alert3ds />}
            </BornPrivateMain>
            <BornPrivateFooter />
            {showErrorModal && errorType && (
                <ReservationErrorModal
                    onClose={() => setShowErrorModal(false)}
                    onExit={() => setShowErrorModal(false)}
                    open={showErrorModal}
                    errorType={errorType}
                />
            )}
        </BornPrivateLayout>
    );
};
export default Donation;
