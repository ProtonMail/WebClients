import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import {
    LoaderPage,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useApi,
    useModalState,
} from '@proton/components';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import {
    COUPON_CODES,
    CYCLE,
    type LatestSubscription,
    PLANS,
    type PlanIDs,
    getLatestCancelledSubscription,
} from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { isFree } from '@proton/shared/lib/user/helpers';

import { usePrefetchGenerateRecoveryKit } from '../../../containers/recoveryPhrase/useRecoveryKitDownload';
import { SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import getAvailablePlansWithCycles from '../../helpers/getAvailablePlansWithCycles';
import DisplayNameStep from './steps/DisplayNameStep';
import RecoveryPhraseStep from './steps/RecoveryPhraseStep';
import AccountDetailsStep from './steps/accountDetails/AccountDetailsStep';

const mailPlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.MAIL]: 1 },
};

export const availablePlans = getAvailablePlansWithCycles([mailPlus], [CYCLE.YEARLY]);

type Step = 'account-details' | 'recovery' | 'display-name' | 'creating-account';

const GreenlandSignupInner = () => {
    const [step, setStep] = useState<Step>('account-details');

    const signup = useSignup();

    const { initializationStatus } = usePaymentOptimistic();

    const notifyError = useNotifyErrorHandler();

    /**
     * We have a recovery step in this flow, so let's prefetch the recovery kit
     */
    usePrefetchGenerateRecoveryKit();

    /**
     * Prevent content flashes where selected plan is initially the default before initialization occurs
     */
    if (!initializationStatus.triggered) {
        return null;
    }

    return (
        <>
            {step === 'account-details' && (
                <AccountDetailsStep
                    onSuccess={async () => {
                        try {
                            await signup.createUser();
                            setStep('creating-account');

                            await signup.setupUser();

                            setStep('recovery');
                        } catch (error) {
                            notifyError(error);
                        }
                    }}
                />
            )}

            {step === 'recovery' && (
                <RecoveryPhraseStep
                    onContinue={async () => {
                        setStep('display-name');
                    }}
                />
            )}

            {step === 'display-name' && (
                <DisplayNameStep
                    onSubmit={async (displayName) => {
                        await signup.setDisplayName(displayName);

                        await signup.login();
                    }}
                />
            )}

            {step === 'creating-account' && <LoaderPage text="Creating your account" />}
        </>
    );
};

interface OfferNotAvailableModalProps extends ModalProps {
    onContinue: () => void;
}

const OfferNotAvailableModal = ({ onContinue, onClose, ...rest }: OfferNotAvailableModalProps) => {
    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="small">
            <ModalTwoHeader title={c('Payments').t`Offer unavailable`} hasClose={false} />
            <ModalTwoContent>
                <div className="text-center">{c('Payments')
                    .t`Sorry, this offer is not available for your account.`}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    color="norm"
                    onClick={() => {
                        onContinue();
                        onClose?.();
                    }}
                    fullWidth
                >
                    {c('Action').t`Close`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

const useRedirects = (props: BaseSignupContextProps) => {
    const unauthApi = useApi();
    const [offerNotAvailableModalProps, setOfferNotAvailableModalOpen, renderOfferNotAvailableModal] = useModalState();

    // Redirect to automatic subscription modal if user has a free account
    // [x] 1. true signup - no user - keep them here
    // [ ] 2. true signup - no user - wrong IP - offer not available (no action for now).
    //     If we do implement it, then we will need to move the useEffect to one of the children,
    //     where we can see the payment context and have access to the payment status.
    // [x] 3. existing free user, no payment history - redirect to subscription modal
    // [x] 4. existing free user, payment history - offer not available
    // [x] 5. existing paid user - offer not available
    useEffect(() => {
        void (async () => {
            const activeSessions = await props.onGetActiveSessions?.();

            const UID = activeSessions?.session?.UID;
            if (!activeSessions?.session?.User || !UID) {
                // Case 1
                return;
            }

            const isFreeUser = isFree(activeSessions.session.User);

            if (isFreeUser) {
                const authApi = getUIDApi(UID, unauthApi);
                const response = await authApi<LatestSubscription>(getLatestCancelledSubscription());
                const previousSubscriptionEndTime = response.LastSubscriptionEnd || 0;
                const hasHadSubscription = previousSubscriptionEndTime > 0;

                if (!hasHadSubscription) {
                    // Case 3
                    window.location.replace(
                        getAppHref(
                            `${getSlugFromApp(APPS.PROTONMAIL)}/dasboard?plan=${PLANS.MAIL}&coupon=${COUPON_CODES.PLUS12FOR1}&currency=EUR&cycle=12&type=offer`,
                            APPS.PROTONACCOUNT
                        )
                    );
                    return;
                }
            }

            // Case 4 or 5
            setOfferNotAvailableModalOpen(true);
        })();
    }, []);

    return {
        offerNotAvailableModal: renderOfferNotAvailableModal ? (
            <OfferNotAvailableModal
                {...offerNotAvailableModalProps}
                onContinue={() => {
                    document.location.assign(getAppHref(SSO_PATHS.APP_SWITCHER, APPS.PROTONACCOUNT));
                }}
            />
        ) : null,
    };
};

const GreenlandSignup = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const { offerNotAvailableModal } = useRedirects(props);

    return (
        <SignupContextProvider
            {...props}
            app="generic"
            flowId="greenland"
            onLogin={async (session) => {
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONMAIL } });
            }}
            paymentsDataConfig={{
                availablePlans,
                plan: {
                    planIDs: { [PLANS.MAIL]: 1 }, // Auto-select Mail Plus
                    currency: 'EUR',
                    cycle: CYCLE.YEARLY,
                    coupon: COUPON_CODES.PLUS12FOR1,
                },
                telemetryContext: 'ctx-signup-greenland',
            }}
            accountFormDataConfig={{
                defaultEmail: searchParams.get('email') || '',
                availableSignupTypes: new Set([SignupType.Proton]),
            }}
        >
            <GreenlandSignupInner />
            {offerNotAvailableModal}
        </SignupContextProvider>
    );
};

export default GreenlandSignup;
