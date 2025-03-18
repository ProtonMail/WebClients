import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useGetPaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useGetPlans } from '@proton/account/plans/hooks';
import type { OnLoginCallback } from '@proton/components';
import {
    LoaderPage,
    StandardLoadErrorPage,
    UnAuthenticated,
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
    useModalState,
} from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import type { AuthSession } from '@proton/components/containers/login/interface';
import { useIsChargebeeEnabled } from '@proton/components/containers/payments/PaymentSwitcher';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { usePaymentsTelemetry } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import type { PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import metrics, { observeApiError } from '@proton/metrics';
import type { FullPlansMap, PaymentMethodFlows } from '@proton/payments';
import { type Currency, DEFAULT_CYCLE, PAYMENT_METHOD_TYPES, PLANS, getPlansMap } from '@proton/payments';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getUser } from '@proton/shared/lib/api/user';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import { getIsPassApp } from '@proton/shared/lib/authentication/apps';
import type { ActiveSession, GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { appendReturnUrlParams } from '@proton/shared/lib/authentication/returnUrl';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getPlanNameFromIDs, hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import { getPathFromLocation, stringifySearchParams } from '@proton/shared/lib/helpers/url';
import { Audience } from '@proton/shared/lib/interfaces';
import type { User } from '@proton/shared/lib/interfaces/User';
import { formatUser } from '@proton/shared/lib/user/helpers';
import { getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import { useFlag, useFlagsStatus } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import mailReferPage from '../../pages/refer-a-friend';
import mailTrialPage from '../../pages/trial';
import { PublicThemeProvider, getPublicTheme } from '../containers/PublicThemeProvider';
import type { Paths } from '../content/helper';
import { getOptimisticDomains, isMailReferAFriendSignup, isMailTrialSignup, isPorkbunSignup } from '../signup/helper';
import type {
    InviteData,
    SessionData,
    SignupActionDoneResponse,
    SignupCacheResult,
    SignupInviteParameters,
    SubscriptionData,
    UserCacheResult,
} from '../signup/interfaces';
import { getPlanIDsFromParams } from '../signup/searchParams';
import { handleDone, handleSetupMnemonic, handleSetupUser, handleSubscribeUser } from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import { useGetAccountKTActivation } from '../useGetAccountKTActivation';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import Layout from './Layout';
import LoginModal from './LoginModal';
import type { Step1Rref } from './Step1';
import Step1 from './Step1';
import Step2 from './Step2';
import SwitchModal from './SwitchModal';
import { defaultSignupModel } from './constants';
import { cachedPlans, cachedPlansMap } from './defaultPlans';
import { getSessionsData } from './getSessionsData';
import {
    getAccessiblePlans,
    getFreeSubscriptionData,
    getIsProductB2BPlan,
    getOptimisticPlanCardSubscriptionData,
    getRelativeUpsellPrice,
    getSessionDataFromSignup,
    getSubscriptionDataCycleMapping,
    getTemporarySignupParameters,
    getUserInfo,
} from './helper';
import type { PlanParameters, SignupModelV2, SignupParameters2, Upsell } from './interface';
import { SignupMode, Steps } from './interface';
import type { TelemetryMeasurementData } from './measure';
import { getPaymentMethodsAvailable, getPlanNameFromSession, getSignupTelemetryData } from './measure';
import AccessModal from './modals/AccessModal';
import SubUserModal from './modals/SubUserModal';
import UnlockModal from './modals/UnlockModal';
import UpsellModal from './modals/UpsellModal';
import VisionaryUpsellModal from './modals/VisionaryUpsellModal';
import { getSignupConfiguration } from './signupConfiguration';
import { getSignupParameters } from './signupParameters';

const getPorkbunPaymentUrl = ({ data }: { data: Extract<SignupInviteParameters, { type: 'porkbun' }>['data'] }) => {
    return getAppHref(
        `${SSO_PATHS.PORKBUN_SIGNUP}${stringifySearchParams(
            {
                email: data.invitee,
                token: data.porkbunToken,
            },
            '?'
        )}`,
        APPS.PROTONACCOUNT
    );
};

const getPorkbunClaimUrl = ({
    data,
    localID,
}: {
    data: Extract<SignupInviteParameters, { type: 'porkbun' }>['data'];
    localID: number;
}) => {
    return getAppHref(
        `/partner/porkbun/claim${stringifySearchParams(
            {
                email: data.invitee,
                token: data.porkbunToken,
            },
            '?'
        )}`,
        APPS.PROTONACCOUNT,
        localID
    );
};

const getRecoveryKit = async () => {
    // Note: This chunkName is important as it's used in the chunk plugin to avoid splitting it into multiple files
    return import(/* webpackChunkName: "recovery-kit" */ '@proton/recovery-kit');
};

interface Props {
    initialSearchParams?: URLSearchParams;
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp?: APP_NAMES;
    toAppName?: string;
    onBack?: () => void;
    clientType: CLIENT_TYPES;
    activeSessions?: ActiveSession[];
    onGetActiveSessions?: () => Promise<GetActiveSessionsResult>;
    fork: boolean;
    metaTags: MetaTags;
    paths: Paths;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    initialSessionsLength: boolean;
}

let ranPreload = false;

const SingleSignupContainerV2 = ({
    initialSearchParams,
    paths,
    metaTags,
    fork,
    toApp,
    activeSessions,
    onGetActiveSessions,
    onLogin,
    productParam,
    clientType,
    onPreSubmit,
    onStartAuth,
    initialSessionsLength,
}: Props) => {
    const getKtActivation = useGetAccountKTActivation();
    const { APP_NAME } = useConfig();
    const visionarySignupEnabled = useFlag('VisionarySignup');
    const lumoSignupEnabled = useFlag('LumoSignupAvailable');

    const { flagsReady } = useFlagsStatus();

    const history = useHistory();
    const location = useLocationWithoutLocale<{ invite?: InviteData }>();
    const audience = (() => {
        if (
            [
                SSO_PATHS.PASS_SIGNUP_B2B,
                SSO_PATHS.MAIL_SIGNUP_B2B,
                SSO_PATHS.DRIVE_SIGNUP_B2B,
                SSO_PATHS.CALENDAR_SIGNUP_B2B,
                SSO_PATHS.BUSINESS_SIGNUP,
            ].includes(location.pathname as any)
        ) {
            return Audience.B2B;
        }
        return Audience.B2C;
    })();
    const isMailTrial = isMailTrialSignup(location);
    const isMailRefer = isMailReferAFriendSignup(location);
    const isPorkbun = isPorkbunSignup(location);
    useMetaTags(isMailRefer ? mailReferPage() : isMailTrial ? mailTrialPage() : metaTags);

    const step1Ref = useRef<Step1Rref | undefined>(undefined);

    // Override the app to always be mail in trial or refer-a-friend signup
    if (isMailTrial || isMailRefer) {
        toApp = APPS.PROTONMAIL;
    }

    let partner: 'porkbun' | undefined;
    if (isPorkbun) {
        toApp = APPS.PROTONMAIL;
        partner = 'porkbun';
    }

    const unauthApi = useApi();
    const { getPaymentsApi } = usePaymentsApi();
    const getPlans = useGetPlans();
    const getPaymentStatus = useGetPaymentStatus();
    const { getPreferredCurrency } = useCurrencies();
    const isChargebeeEnabled = useIsChargebeeEnabled();
    const { reportPaymentSuccess, reportPaymentFailure } = usePaymentsTelemetry({
        flow: 'signup-pass',
    });
    const [error, setError] = useState<any>();
    const handleError = useErrorHandler();
    const [tmpLoginEmail, setTmpLoginEmail] = useState('');
    const [switchModalProps, setSwitchModal, renderSwitchModal] = useModalState();
    const [loginModalProps, setLoginModal, renderLoginModal] = useModalState();
    const { viewportWidth } = useActiveBreakpoint();

    const [unlockModalProps, setUnlockModal, renderUnlockModal] = useModalState();
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const [visionaryModalProps, setVisionaryModal, renderVisionaryModal] = useModalState();
    const [subUserModalProps, setSubUserModal, renderSubUserModal] = useModalState();
    const [accessModalProps, setHasAccessModal, renderAccessModal] = useModalState();

    const [signupParameters, setSignupParameters] = useState((): SignupParameters2 => {
        return getSignupParameters({
            toApp,
            location,
            visionarySignupEnabled,
            initialSearchParams,
            isMailTrial,
            partner,
        });
    });

    const theme = getPublicTheme(toApp, audience, viewportWidth, signupParameters);

    const [model, setModel] = useState<SignupModelV2>(() => {
        // Add free plan
        const plans = cachedPlans;
        const plansMap = cachedPlansMap;
        const currency = 'CHF';
        const cycle = signupParameters.cycle || DEFAULT_CYCLE;

        const signupConfiguration = getSignupConfiguration({
            toApp,
            audience,
            signupParameters,
            viewportWidth,
            theme,
            model: defaultSignupModel,
            vpnServersCountData: defaultSignupModel.vpnServersCountData,
        });

        const planParameters = getPlanIDsFromParams(plans, 'CHF', signupParameters, signupConfiguration.defaults);
        const planIDs = planParameters.planIDs;

        const billingAddress = {
            CountryCode: '',
            State: '',
        };

        const subscriptionData = getOptimisticPlanCardSubscriptionData({
            currency,
            cycle,
            planIDs,
            plansMap,
            billingAddress,
        });

        return {
            ...defaultSignupModel,
            domains: getOptimisticDomains(),
            plans,
            plansMap,
            planParameters,
            subscriptionData,
        };
    });
    const setModelDiff = useCallback((diff: Partial<SignupModelV2>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    }, []);

    const UID = model.session?.resumedSessionResult.UID;
    const normalApi = UID ? getUIDApi(UID, unauthApi) : unauthApi;
    const vpnServersCountData = model.vpnServersCountData;
    const silentApi = getSilentApi(normalApi);

    const signupConfiguration = getSignupConfiguration({
        toApp,
        audience,
        signupParameters,
        viewportWidth,
        theme,
        model,
        vpnServersCountData,
    });
    const {
        planCards,
        product,
        shortProductAppName,
        productAppName,
        preload,
        onboarding,
        setupImg,
        defaults,
        generateMnemonic,
        CustomStep,
    } = signupConfiguration;

    useEffect(() => {
        const run = async () => {
            // In the main container so that it's ready, but can potentially be moved to custom step
            const app = APPS.PROTONPASSBROWSEREXTENSION;

            const result = await sendExtensionMessage(
                { type: 'pass-installed' },
                { app: APPS.PROTONPASSBROWSEREXTENSION, maxTimeout: 1_000 }
            );

            setModelDiff({ extension: { app, installed: result?.type === 'success' } });
        };

        run().catch(noop);
    }, []);

    useLayoutEffect(() => {
        if (!generateMnemonic || ranPreload) {
            return;
        }
        ranPreload = true;

        setTimeout(() => {
            /* Custom preload */
            getRecoveryKit()
                .then((result) => {
                    document.body.append(...result.getPrefetch());
                })
                .catch((e) => {
                    traceError(e);
                });
        }, 0);
    }, [generateMnemonic]);

    const measure = (data: TelemetryMeasurementData) => {
        const values = 'values' in data ? data.values : {};
        const flow = (() => {
            if (toApp === APPS.PROTONDRIVE || toApp === APPS.PROTONDOCS) {
                if (audience === Audience.B2B) {
                    return 'drive_signup_b2b';
                }
                return 'drive_signup';
            }
            if (toApp === APPS.PROTONCALENDAR) {
                if (audience === Audience.B2B) {
                    return 'calendar_signup_b2b';
                }
                return 'calendar_signup';
            }
            if (toApp === APPS.PROTONMAIL) {
                if (audience === Audience.B2B) {
                    return 'mail_signup_b2b';
                }
                return 'mail_signup';
            }
            if (toApp === APPS.PROTONWALLET) {
                return 'wallet_signup';
            }
            if (getIsPassApp(toApp)) {
                if (audience === Audience.B2B) {
                    return 'pass_signup_b2b';
                }
                return 'pass_signup';
            }
            if (productParam === 'business') {
                return 'business_signup';
            }
            if (toApp === APPS.PROTONLUMO) {
                return 'lumo_signup';
            }
            return 'generic_signup';
        })();
        return sendTelemetryReport({
            api: unauthApi,
            measurementGroup: TelemetryMeasurementGroups.accountSignup,
            event: data.event,
            dimensions: {
                ...data.dimensions,
                flow,
            },
            values,
            delay: false,
        }).catch(noop);
    };

    const upsellPlanCard = planCards[audience].find((planCard) => planCard.type === 'best');

    const triggerModals = ({
        session,
        upsell,
        planParameters,
    }: {
        session: SessionData;
        upsell: Upsell;
        subscriptionData: SubscriptionData;
        planParameters?: PlanParameters;
    }) => {
        const planName = getPlanNameFromSession(session);

        if (session.state.access) {
            setHasAccessModal(true);
            return;
        }

        if (session.subscription && upsell.plan?.Name) {
            // The selected plan is the plan we upsell to, pass through
            if (planParameters?.plan.Name === upsell.plan.Name) {
                return;
            }
            if ([PLANS.BUNDLE, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024].includes(upsell.plan.Name as any)) {
                setUnlockModal(true);
                return;
            }
            if (PLANS.VISIONARY === upsell.plan.Name) {
                setVisionaryModal(true);
                return;
            }
            // The selected plan is different from the plan we upsell to, show the upsell modal
            setUpsellModal(true);
            return;
        }

        if (session.organization && !session.state.payable) {
            if (getIsProductB2BPlan(planName)) {
                setSubUserModal(true);
                return;
            }
        }
    };

    const changeCurrency = async (newCurrency: Currency): Promise<FullPlansMap> => {
        const plansMap = getPlansMap(model.plans, newCurrency, false);

        // if there is session, then use auth api, if there is no, then use unauth
        const silentApi = getSilentApi(
            model.session ? getUIDApi(model.session.resumedSessionResult.UID, unauthApi) : unauthApi
        );
        const paymentsApi = getPaymentsApi(silentApi);

        const subscriptionDataCycleMapping = await getSubscriptionDataCycleMapping({
            paymentsApi,
            plansMap,
            signupConfiguration,
            coupon: signupParameters.coupon,
        });

        setModelDiff({
            plansMap,
            subscriptionDataCycleMapping,
        });

        return plansMap;
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            await onStartAuth().catch(noop);
            let silentApi = getSilentApi(unauthApi);

            const sessionsData = await getSessionsData({
                signupParameters,
                activeSessions,
                api: silentApi,
                onGetActiveSessions,
            });

            const resumedSession = sessionsData.session;

            if (
                !resumedSession &&
                signupParameters.invite?.type === 'porkbun' &&
                window.location.pathname === SSO_PATHS.PORKBUN_SIGN_IN
            ) {
                const url = new URL(SSO_PATHS.LOGIN, window.location.origin);
                url.searchParams.append('partner', signupParameters.invite.type);
                url.searchParams.append('email', signupParameters.invite.data.invitee);
                url.searchParams.append('prompt', 'login');
                appendReturnUrlParams(url.searchParams, {
                    url: getPathFromLocation(
                        new URL(
                            getPorkbunPaymentUrl({
                                data: signupParameters.invite.data,
                            })
                        )
                    ),
                    context: 'public',
                    target: 'account',
                });
                window.location.replace(url.toString());
                // Promise that never resolves
                await new Promise<void>(() => {});
            }

            let chargebeeEnabled = undefined;
            if (resumedSession) {
                silentApi = getUIDApi(resumedSession.UID, silentApi);
                const user = resumedSession.User;
                chargebeeEnabled = await isChargebeeEnabled(resumedSession.UID, async () => user);
            }

            const paymentsApi = getPaymentsApi(silentApi, chargebeeEnabled?.result);

            const [{ plans, freePlan }, paymentMethodStatus] = await Promise.all([
                getPlans({ api: silentApi }),
                getPaymentStatus({ api: silentApi }),
            ]);

            const currency = getPreferredCurrency({
                status: paymentMethodStatus,
                plans: getAccessiblePlans({
                    planCards,
                    audience,
                    plans,
                    paramPlanName: signupParameters.preSelectedPlan,
                }),
                paramCurrency: signupParameters.currency,
                paramPlanName: signupParameters.preSelectedPlan,
                user: resumedSession?.User ? formatUser(resumedSession?.User) : undefined,
            });

            const modifiedSignupParameters = await getTemporarySignupParameters({
                session: resumedSession,
                signupParameters,
                api: silentApi,
            });
            const planParameters = getPlanIDsFromParams(plans, currency, modifiedSignupParameters, defaults);
            const cycle = modifiedSignupParameters.cycle || defaults.cycle;
            const invite = modifiedSignupParameters.invite;
            const coupon = modifiedSignupParameters.coupon;

            const plansMap = getPlansMap(plans, currency, false);

            void getVPNServersCountData(silentApi).then((vpnServersCountData) => setModelDiff({ vpnServersCountData }));

            const [
                { Domains: domains },
                referralData,
                { subscriptionData, upsell, ...userInfo },
                subscriptionDataCycleMapping,
            ] = await Promise.all([
                silentApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                invite?.type === 'mail'
                    ? await silentApi(checkReferrer(invite.data.referrer))
                          .then(() => ({
                              referrer: invite.data.referrer,
                              invite: invite.data.invite || '',
                          }))
                          .catch(() => undefined)
                    : undefined,
                getUserInfo({
                    audience,
                    api: silentApi,
                    paymentsApi,
                    user: resumedSession?.User,
                    plans,
                    plansMap,
                    upsellPlanCard,
                    planParameters,
                    signupParameters: modifiedSignupParameters,
                    options: {
                        plansMap: plansMap,
                        planIDs: planParameters.planIDs,
                        currency,
                        cycle,
                        coupon,
                        billingAddress: {
                            CountryCode: paymentMethodStatus.CountryCode,
                            State: paymentMethodStatus.State,
                        },
                    },
                    toApp: product,
                    availableCycles: signupConfiguration.cycles,
                }),
                getSubscriptionDataCycleMapping({
                    signupConfiguration,
                    paymentsApi,
                    plansMap,
                    // if plan parameters are defined, we assume we won't be showing the plan cards
                    // and that we won't need to fetch the subscription data from the API call with each coupon
                    coupon: planParameters.defined ? null : coupon,
                }),
            ]);

            let session: SessionData | undefined;
            if (resumedSession) {
                session = {
                    resumedSessionResult: resumedSession,
                    ...userInfo,
                };
            }

            // TODO: How to define already paid behavior?
            if (resumedSession && userInfo.state.access && signupParameters.invite?.type === 'porkbun') {
                // Once porkbun payment has completed, the next step is to link the domains
                window.location.replace(
                    getPorkbunClaimUrl({
                        localID: resumedSession.LocalID,
                        data: signupParameters.invite.data,
                    })
                );
                // Promise that never resolves
                await new Promise<void>(() => {});
            }

            const signupParametersDiff: Partial<SignupParameters2> = {};
            if (signupParameters.mode === SignupMode.Invite && signupParameters.hideFreePlan) {
                signupParametersDiff.hideFreePlan = false;
            }
            if (referralData) {
                signupParametersDiff.mode = SignupMode.MailReferral;
            } else {
                if (signupParameters.mode === SignupMode.MailReferral) {
                    signupParametersDiff.mode = SignupMode.Default;
                }
                if (isMailTrial || isMailRefer) {
                    history.replace(SSO_PATHS.SIGNUP);
                }
            }
            if (Object.keys(signupParametersDiff).length > 0) {
                setSignupParameters((old) => ({ ...old, ...signupParametersDiff }));
            }

            setModelDiff({
                session,
                domains,
                upsell,
                plans,
                planParameters,
                plansMap,
                freePlan,
                subscriptionDataCycleMapping,
                referralData,
                inviteData: signupParameters.invite?.type === 'generic' ? signupParameters.invite.data : undefined,
                paymentMethodStatusExtended: paymentMethodStatus,
                subscriptionData,
                cache: undefined,
                source: signupParameters.source,
                loadingDependencies: false,
            });

            if (session?.resumedSessionResult.User) {
                triggerModals({
                    planParameters,
                    session,
                    upsell,
                    subscriptionData,
                });

                const planName = getPlanNameFromSession(session);
                measure({
                    event: TelemetryAccountSignupEvents.pageLoad,
                    dimensions: {
                        signedin: 'yes',
                        intent: normalizeProduct(productParam),
                        plan: planName,
                    },
                });
            } else {
                measure({
                    event: TelemetryAccountSignupEvents.pageLoad,
                    dimensions: {
                        signedin: 'no',
                        intent: normalizeProduct(productParam),
                        plan: PLANS.FREE,
                    },
                });
            }
            measure({
                event: TelemetryAccountSignupEvents.bePaymentMethods,
                dimensions: getPaymentMethodsAvailable(paymentMethodStatus.VendorStates),
            });
        };

        void fetchDependencies()
            .then(() => {
                metrics.core_single_signup_fetchDependencies_total.increment({
                    status: 'success',
                });
            })
            .catch((error) => {
                setError(error);

                observeApiError(error, (status) =>
                    metrics.core_single_signup_fetchDependencies_total.increment({
                        status,
                    })
                );
            });

        return () => {};
    }, []);

    const accountRef = useRef({ signingOut: false, signingIn: false });

    const handleSignOut = async (reset = false) => {
        if (!model.plans.length || accountRef.current.signingIn || accountRef.current.signingOut) {
            return;
        }

        setSignupParameters((previous) => {
            // Clear the email on signout, signout implies the email exists so don't need to autofill it again
            if (previous.email) {
                return {
                    ...previous,
                    email: undefined,
                };
            }
            return previous;
        });

        try {
            accountRef.current.signingOut = true;
            await onStartAuth();

            // Override the silentApi to not use the one with the UID as we prepare the state
            const silentApi = getSilentApi(unauthApi);

            // Reset planIDs
            const planIDs = (() => {
                if (model.planParameters?.defined) {
                    return model.planParameters.planIDs;
                }
                const previousPlanIDs = model.subscriptionData.planIDs;
                // We keep the previous plan IDs if no addon was added and if the selected plan is included in any of the offered plans.
                if (
                    !reset &&
                    Object.keys(previousPlanIDs).length <= 1 &&
                    planCards[audience].some((planCard) => (previousPlanIDs[planCard.plan] ?? 0) > 0)
                ) {
                    return previousPlanIDs;
                }
                return model.planParameters?.planIDs;
            })();

            const cycle = signupParameters.cycle || signupConfiguration.defaults.cycle;

            const paymentsApi = getPaymentsApi(silentApi);
            const userInfoPromise = getUserInfo({
                audience,
                api: silentApi,
                paymentsApi,
                options: {
                    plansMap: model.plansMap,
                    cycle,
                    currency: model.subscriptionData.currency,
                    planIDs,
                    coupon: signupParameters.coupon,
                    billingAddress: model.subscriptionData.billingAddress,
                },
                planParameters: model.planParameters!,
                signupParameters,
                plans: model.plans,
                plansMap: model.plansMap,
                upsellPlanCard,
                toApp: product,
                availableCycles: signupConfiguration.cycles,
            });

            const statusPromise = paymentsApi.statusExtendedAutomatic();

            const [{ subscriptionData, upsell }, paymentMethodStatusExtended] = await Promise.all([
                userInfoPromise,
                statusPromise,
            ]);

            measure({ event: TelemetryAccountSignupEvents.beSignOutSuccess, dimensions: {} });

            setModelDiff({
                optimistic: {},
                session: undefined,
                cache: undefined,
                upsell,
                subscriptionData,
                paymentMethodStatusExtended,
            });
        } finally {
            accountRef.current.signingOut = false;
        }
    };

    const handleSignIn = async (
        authSession: AuthSession,
        options?: {
            ignore?: boolean;
            /**
             * If true then derives the parameters (planIDs, cycle, currency) for subscription/check endpoint from the
             * URL parameters instead using the ones cached in the model. It is useful when we want to handle call
             * handleSignIn function as if it would be called on initial page loading.
             */
            restoreParameters: boolean;
        }
    ) => {
        if (
            !model.plans.length ||
            (!options?.ignore && accountRef.current.signingIn) ||
            accountRef.current.signingOut
        ) {
            return;
        }

        if (signupParameters.invite?.type === 'porkbun') {
            window.location.replace(
                getPorkbunPaymentUrl({
                    data: { ...signupParameters.invite.data, invitee: authSession.data.User.Email },
                })
            );
            // Promise that never resolves
            return new Promise(() => {});
        }

        try {
            accountRef.current.signingIn = true;
            // Override the silentApi to not use the one with the UID as we prepare the state
            const silentApi = getSilentApi(getUIDApi(authSession.data.UID, unauthApi));

            const [user] = await Promise.all([
                authSession.data.User || silentApi<{ User: User }>(getUser()).then(({ User }) => User),
            ]);

            const chargebeeEnabled = await isChargebeeEnabled(authSession.data.UID, async () => user);

            const { cycle, currency, planIDs } = (() => {
                const modelCycle = model.subscriptionData.cycle;
                const modelCurrency = model.subscriptionData.currency;

                if (options?.restoreParameters) {
                    return {
                        cycle: signupParameters.cycle ?? modelCycle,
                        currency: signupParameters.currency ?? modelCurrency,
                        planIDs: getPlanIDsFromParams(
                            model.plans,
                            model.subscriptionData.currency,
                            signupParameters,
                            signupConfiguration.defaults
                        ).planIDs,
                    };
                } else {
                    return {
                        cycle: modelCycle,
                        currency: modelCurrency,
                        planIDs: model.subscriptionData.planIDs,
                    };
                }
            })();

            const { subscriptionData, upsell, ...userInfo } = await getUserInfo({
                api: silentApi,
                audience,
                paymentsApi: getPaymentsApi(silentApi, chargebeeEnabled.result),
                user,
                plans: model.plans,
                plansMap: model.plansMap,
                upsellPlanCard,
                planParameters: model.planParameters!,
                signupParameters,
                options: {
                    plansMap: model.plansMap,
                    cycle,
                    currency,
                    planIDs,
                    coupon: model.subscriptionData.checkResult?.Coupon?.Code,
                    billingAddress: model.subscriptionData.billingAddress,
                },
                toApp: product,
                availableCycles: signupConfiguration.cycles,
            });

            const session: SessionData = {
                resumedSessionResult: authSession.data,
                ...userInfo,
            };

            setModelDiff({
                optimistic: {},
                session,
                cache: undefined,
                subscriptionData,
                upsell,
            });

            triggerModals({ planParameters: model.planParameters, session, upsell, subscriptionData });
            measure({
                event: TelemetryAccountSignupEvents.beSignInSuccess,
                dimensions: { plan: getPlanNameFromSession(session) },
            });

            metrics.core_single_signup_signedInSession_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_single_signup_signedInSession_total.increment({
                    status,
                })
            );
        } finally {
            accountRef.current.signingIn = false;
        }
    };

    const handleSwitchSession = async (session: ActiveSession) => {
        if (!model.plans.length || accountRef.current.signingIn || accountRef.current.signingOut) {
            return;
        }
        try {
            accountRef.current.signingIn = true;
            const silentApi = getSilentApi(unauthApi);
            const resumedSession = await resumeSession({
                api: silentApi,
                localID: session.persisted.localID,
            });
            if (resumedSession) {
                return await handleSignIn(
                    { data: resumedSession },
                    {
                        ignore: true,
                        restoreParameters: true,
                    }
                );
            }
        } finally {
            accountRef.current.signingIn = false;
        }
    };

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    const canGenerateMnemonic = (() => {
        const user = model.session;
        if (user) {
            return false;
        }
        return generateMnemonic;
    })();

    const br = <br key="br" />;

    const handleFinalizeSignup = async (result: SignupActionDoneResponse) => {
        try {
            if (signupParameters.invite?.type === 'porkbun') {
                // If it's porkbun signup, we reload this page to show the "signed in payment mode"
                window.location.replace(
                    getPorkbunPaymentUrl({
                        data: { ...signupParameters.invite.data, invitee: result.session.data.User.Email },
                    })
                );
                // Promise that never resolves
                return await new Promise<void>(() => {});
            }

            await onLogin(result.session);

            metrics.core_single_signup_complete_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_single_signup_complete_total.increment({
                    status,
                })
            );
            handleError(error);
        }
    };

    const handleLoginUser = async (cache: UserCacheResult) => {
        try {
            if (signupParameters.invite?.type === 'porkbun') {
                // Once porkbun payment has completed, the next step is to link the domains
                window.location.replace(
                    getPorkbunClaimUrl({
                        localID: cache.session.resumedSessionResult.LocalID,
                        data: signupParameters.invite.data,
                    })
                );
                // Promise that never resolves
                return await new Promise<void>(() => {});
            }

            await onLogin({
                data: cache.session.resumedSessionResult,
                flow: 'login',
            });

            metrics.core_single_signup_complete_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_single_signup_complete_total.increment({
                    status,
                })
            );
            handleError(error);
        }
    };

    const handleStartUserOnboarding = async (subscriptionData: SubscriptionData) => {
        if (!model.session) {
            throw new Error('Missing user session');
        }
        const cache: UserCacheResult = {
            type: 'user',
            subscriptionData,
            session: model.session,
        };
        if (onboarding.user) {
            setModelDiff({ subscriptionData: cache.subscriptionData, cache, step: Steps.Loading });
        } else {
            await handleLoginUser(cache);
        }
    };

    const relativePricePerMonth = getRelativeUpsellPrice(
        model.upsell,
        model.plansMap,
        model.subscriptionData.checkResult,
        model.session?.subscription,
        model.optimistic.cycle || model.subscriptionData.cycle
    );
    const relativePrice =
        relativePricePerMonth > 0
            ? getSimplePriceString(model.optimistic.currency || model.subscriptionData.currency, relativePricePerMonth)
            : undefined;

    const getMnemonicSetup = async () => {
        const recoveryKitGeneration = canGenerateMnemonic
            ? await getRecoveryKit()
                  .then((result) => result.generatePDFKit)
                  .catch(noop)
            : undefined;
        return {
            enabled: canGenerateMnemonic,
            generate: recoveryKitGeneration,
        };
    };

    const getTelemetryParams = (subscriptionData: SubscriptionData, isAuthenticated: boolean) => {
        const method: PaymentProcessorType | 'n/a' = subscriptionData.payment?.paymentProcessorType ?? 'n/a';
        const plan = getPlanNameFromIDs(subscriptionData.planIDs);

        const flow: PaymentMethodFlows = isAuthenticated ? 'signup-pass-upgrade' : 'signup-pass';

        return {
            method,
            overrides: {
                plan,
                flow,
                cycle: subscriptionData.cycle,
                amount: subscriptionData.checkResult.AmountDue,
            },
        };
    };

    const getReportPaymentSuccess = (subscriptionData: SubscriptionData, isAuthenticated: boolean) => {
        return () => {
            const { method, overrides } = getTelemetryParams(subscriptionData, isAuthenticated);
            reportPaymentSuccess(method, overrides);
        };
    };

    const getReportPaymentFailure = (subscriptionData: SubscriptionData, isAuthenticated: boolean) => {
        return async () => {
            // in case if fails, for example, on the subscription stage, then this page will abort all
            // API calls by triggering startUnAuthFlow which in turn calls the abort controller.
            // This delay is to ensure that the reportPaymentFailure is called after the abort controller
            // is called
            await wait(0);
            const { method, overrides } = getTelemetryParams(subscriptionData, isAuthenticated);
            reportPaymentFailure(method, overrides);
        };
    };

    const handleSetupExistingUser = async (cache: UserCacheResult) => {
        const setupMnemonic = await getMnemonicSetup();

        const getMnemonicData = async () => {
            if (!canGenerateMnemonic || !setupMnemonic.generate) {
                return;
            }
            const user = cache.session.resumedSessionResult.User;
            const emailAddress = user.Email || user.Name || '';
            const mnemonicData = await handleSetupMnemonic({
                api: silentApi,
                setupMnemonic,
                user,
                keyPassword: cache.session.resumedSessionResult.keyPassword,
                emailAddress,
            });
            return mnemonicData;
        };

        const run = async () => {
            const isAuthenticated = !!model.session?.resumedSessionResult.UID;
            await handleSubscribeUser(
                silentApi,
                cache.subscriptionData,
                undefined,
                productParam,
                getReportPaymentSuccess(cache.subscriptionData, isAuthenticated),
                getReportPaymentFailure(cache.subscriptionData, isAuthenticated)
            );

            if (cache.setupData) {
                return cache.setupData;
            }

            const mnemonicData = await getMnemonicData();

            return {
                mnemonicData,
            };
        };

        const [setupData] = await Promise.all([run(), wait(3500)]);

        return {
            ...cache,
            setupData,
        };
    };

    const handleSetupNewUser = async (cache: SignupCacheResult): Promise<SignupCacheResult> => {
        const setupMnemonic = await getMnemonicSetup();
        const isAuthenticated = !!model.session?.resumedSessionResult.UID;

        const [result] = await Promise.all([
            handleSetupUser({
                cache,
                api: silentApi,
                ignoreVPN: true,
                setupMnemonic,
                reportPaymentSuccess: getReportPaymentSuccess(cache.subscriptionData, isAuthenticated),
                reportPaymentFailure: getReportPaymentFailure(cache.subscriptionData, isAuthenticated),
            }),
            wait(3500),
        ]);

        measure(getSignupTelemetryData(model.plansMap, cache));

        return result.cache;
    };

    if (toApp === APPS.PROTONLUMO && flagsReady && !lumoSignupEnabled) {
        return <Redirect to={SSO_PATHS.LOGIN} />;
    }

    if (toApp === APPS.PROTONLUMO && !flagsReady) {
        return <LoaderPage />;
    }

    const loginModalDefaultUsername = isPorkbun ? '' : tmpLoginEmail;

    return (
        <PublicThemeProvider value={theme}>
            {preload}
            {renderLoginModal && (
                <LoginModal
                    productParam={productParam}
                    paths={paths}
                    onStartAuth={onStartAuth}
                    {...loginModalProps}
                    defaultUsername={loginModalDefaultUsername}
                    onLogin={async (props) => {
                        await handleSignIn(props);
                        setLoginModal(false);
                        return { state: 'input' };
                    }}
                />
            )}
            {renderSwitchModal && (
                <SwitchModal
                    user={model.session?.resumedSessionResult.User}
                    sessions={activeSessions}
                    {...switchModalProps}
                    onSwitchSession={async (props) => {
                        await handleSwitchSession(props);
                        setSwitchModal(false);
                    }}
                />
            )}
            {renderUnlockModal && (
                <UnlockModal
                    {...unlockModalProps}
                    title={c('pass_signup_2023: Title').jt`All ${BRAND_NAME} Plus services.${br}One easy subscription.`}
                    dark={theme.dark}
                    currentPlan={model.upsell.currentPlan}
                    appName={shortProductAppName}
                    subscriptionData={model.subscriptionData}
                    upsellPlan={model.upsell.plan}
                    unlockPlan={model.upsell.unlockPlan}
                    relativePrice={relativePrice}
                    plansMap={model.plansMap}
                    onUpgrade={() => {
                        unlockModalProps.onClose();
                        step1Ref.current?.scrollIntoPayment();
                    }}
                    onFree={async () => {
                        unlockModalProps.onClose();
                        await handleStartUserOnboarding(getFreeSubscriptionData(model.subscriptionData));
                    }}
                />
            )}
            {renderUpsellModal && (
                <UpsellModal
                    {...upsellModalProps}
                    dark={theme.dark}
                    currentPlan={model.upsell.currentPlan}
                    appName={shortProductAppName}
                    subscriptionData={model.subscriptionData}
                    upsellPlan={model.upsell.plan}
                    freePlan={model.freePlan}
                    vpnServersCountData={model.vpnServersCountData}
                    unlockPlan={model.upsell.unlockPlan}
                    relativePrice={relativePrice}
                    plansMap={model.plansMap}
                    onUpgrade={() => {
                        upsellModalProps.onClose();
                        step1Ref.current?.scrollIntoPayment();
                    }}
                    onFree={async () => {
                        upsellModalProps.onClose();
                        await handleStartUserOnboarding(getFreeSubscriptionData(model.subscriptionData));
                    }}
                />
            )}
            {renderVisionaryModal && (
                <VisionaryUpsellModal
                    {...visionaryModalProps}
                    plan={model.plansMap[PLANS.VISIONARY]?.Title || ''}
                    appName={productAppName}
                    onUpgrade={async () => {
                        visionaryModalProps.onClose();
                        step1Ref.current?.scrollIntoPayment();
                    }}
                    onContinue={async () => {
                        visionaryModalProps.onClose();
                        await handleStartUserOnboarding(getFreeSubscriptionData(model.subscriptionData));
                    }}
                />
            )}
            {renderAccessModal && (
                <AccessModal
                    {...accessModalProps}
                    user={model.session?.resumedSessionResult.User}
                    app={product}
                    onSignOut={() => {
                        return handleSignOut(true);
                    }}
                    onContinue={async () => {
                        await handleStartUserOnboarding(getFreeSubscriptionData(model.subscriptionData));
                    }}
                />
            )}
            {renderSubUserModal && (
                <SubUserModal
                    {...subUserModalProps}
                    dark={theme.dark}
                    currentPlan={model.upsell.currentPlan}
                    appName={shortProductAppName}
                    plansMap={model.plansMap}
                    upsellPlan={model.upsell.plan}
                    unlockPlan={model.upsell.unlockPlan}
                    onSignOut={() => {
                        return handleSignOut(true);
                    }}
                    onContinue={async () => {
                        await handleStartUserOnboarding(getFreeSubscriptionData(model.subscriptionData));
                    }}
                />
            )}
            <UnAuthenticated theme={theme.type}>
                {model.step === Steps.Account && (
                    <Step1
                        initialSessionsLength={initialSessionsLength}
                        signupConfiguration={signupConfiguration}
                        activeSessions={activeSessions}
                        signupParameters={signupParameters}
                        relativePrice={relativePrice}
                        step1Ref={step1Ref}
                        isLargeViewport={viewportWidth['>=large']}
                        api={normalApi}
                        measure={measure}
                        currentPlan={model.upsell.currentPlan}
                        onOpenSwitch={() => {
                            if (model.loadingDependencies) {
                                return;
                            }
                            setSwitchModal(true);
                        }}
                        onOpenLogin={(options) => {
                            setTmpLoginEmail(options.email);
                            setLoginModal(true);
                            measure({
                                event: TelemetryAccountSignupEvents.userSignIn,
                                dimensions: { location: options.location },
                            });
                        }}
                        vpnServersCountData={vpnServersCountData}
                        model={model}
                        setModel={setModel}
                        onSignOut={handleSignOut}
                        onChangeCurrency={changeCurrency}
                        onComplete={async (data) => {
                            if (data.type === 'existing') {
                                const { subscriptionData } = data;

                                if (!model.session) {
                                    throw new Error('Missing session');
                                }

                                const userCacheResult: UserCacheResult = {
                                    type: 'user',
                                    subscriptionData,
                                    session: model.session,
                                    // Might be existing from the token setup
                                    setupData: model.cache?.setupData,
                                };

                                setModelDiff({
                                    subscriptionData: userCacheResult.subscriptionData,
                                    cache: userCacheResult,
                                    step: Steps.Loading,
                                });

                                metrics.core_single_signup_setup_total.increment({
                                    status: 'success',
                                });
                                return;
                            }

                            try {
                                const { accountData, subscriptionData } = data;

                                await onPreSubmit?.();
                                await onStartAuth().catch(noop);

                                const cache: SignupCacheResult = {
                                    type: 'signup',
                                    appName: APP_NAME,
                                    appIntent: undefined,
                                    productParam,
                                    // Internal app or oauth app or vpn
                                    ignoreExplore: toApp !== undefined,
                                    accountData,
                                    subscriptionData,
                                    inviteData: model.inviteData,
                                    referralData: model.referralData,
                                    persistent: false,
                                    trusted: false,
                                    clientType,
                                    ktActivation: await getKtActivation(),
                                };

                                if (data.type === 'signup-token') {
                                    const tmpCache = {
                                        ...cache,
                                        subscriptionData: getFreeSubscriptionData(subscriptionData),
                                    };
                                    const userCreationResult = await handleCreateUser({
                                        invite: signupParameters.invite,
                                        cache: tmpCache,
                                        api: silentApi,
                                        mode: 'cro',
                                    });
                                    const setupCache = await handleSetupNewUser(userCreationResult.cache);
                                    const cacheWithOriginalSubscription = {
                                        ...setupCache,
                                        subscriptionData: cache.subscriptionData,
                                    };
                                    setModelDiff({
                                        session: {
                                            ...getSessionDataFromSignup(setupCache),
                                            defaultPaymentMethod: PAYMENT_METHOD_TYPES.BITCOIN,
                                        },
                                        // Set back original subscription data
                                        subscriptionData: cacheWithOriginalSubscription.subscriptionData,
                                        cache: cacheWithOriginalSubscription,
                                        signupTokenMode: true,
                                    });
                                } else {
                                    const result = await handleCreateUser({
                                        invite: signupParameters.invite,
                                        cache,
                                        api: silentApi,
                                        mode:
                                            product === APPS.PROTONPASS || product === APPS.PROTONDRIVE ? 'ov' : 'cro',
                                    });
                                    setModelDiff({
                                        subscriptionData: result.cache.subscriptionData,
                                        cache: result.cache,
                                        step: Steps.Loading,
                                    });
                                }

                                metrics.core_single_signup_setup_total.increment({
                                    status: 'success',
                                });
                            } catch (error: any) {
                                observeApiError(error, (status) =>
                                    metrics.core_single_signup_setup_total.increment({
                                        status,
                                    })
                                );

                                handleError(error);
                                if (error?.config?.url?.endsWith?.('keys/setup')) {
                                    captureMessage(`Signup setup failure`);
                                }
                            }
                        }}
                        mode={signupParameters.mode}
                    />
                )}
                {model.step === Steps.Loading && (
                    <Layout logo={signupConfiguration.logo} hasDecoration={false}>
                        <Step2
                            logo={signupConfiguration.logo}
                            steps={(() => {
                                const hasPlans = hasPlanIDs(model.subscriptionData.planIDs);
                                const hasPayment = hasPlans && model.subscriptionData.checkResult.AmountDue > 0;
                                const hasSession = !!model.session?.resumedSessionResult.User;

                                const list = [
                                    hasPayment && c('pass_signup_2023: Info').t`Verifying your payment`,
                                    !hasSession && c('pass_signup_2023: Info').t`Creating your account`,
                                    !hasPayment &&
                                        hasSession &&
                                        hasPlans &&
                                        c('pass_signup_2023: Info').t`Updating your account`,
                                    canGenerateMnemonic && c('pass_signup_2023: Info').t`Preparing your Recovery Kit`,
                                ].filter(isTruthy);
                                if (!list.length) {
                                    list.push(c('pass_signup_2023: Info').t`Updating your account`);
                                }
                                return list;
                            })()}
                            product={productAppName}
                            img={setupImg}
                            onSetup={async () => {
                                const cache = model.cache;
                                if (!cache) {
                                    throw new Error('Missing cache');
                                }

                                try {
                                    if (cache.type === 'user') {
                                        const result = await handleSetupExistingUser(cache);
                                        if (onboarding.user) {
                                            setModelDiff({
                                                cache: result,
                                                step: Steps.Custom,
                                            });
                                        } else {
                                            await handleLoginUser(result);
                                        }
                                    }
                                    if (cache.type === 'signup') {
                                        const result = await handleSetupNewUser(cache);
                                        if (onboarding.signup) {
                                            setModelDiff({
                                                cache: result,
                                                step: Steps.Custom,
                                            });
                                        } else {
                                            await handleFinalizeSignup(
                                                handleDone({
                                                    cache: result,
                                                    appIntent: { app: product },
                                                })
                                            );
                                        }
                                    }

                                    metrics.core_single_signup_setup_total.increment({
                                        status: 'success',
                                    });
                                } catch (error) {
                                    observeApiError(error, (status) =>
                                        metrics.core_single_signup_setup_total.increment({
                                            status,
                                        })
                                    );

                                    await onStartAuth().catch(noop);
                                    handleError(error);
                                    setModelDiff({
                                        cache: undefined,
                                        step: Steps.Account,
                                    });
                                }
                            }}
                        />
                    </Layout>
                )}
                {model.step === Steps.Custom && (
                    <CustomStep
                        product={product}
                        signupParameters={signupParameters}
                        audience={audience}
                        measure={measure}
                        fork={fork}
                        model={model}
                        onChangeModel={setModelDiff}
                        productAppName={productAppName}
                        setupImg={setupImg}
                        logo={signupConfiguration.logo}
                        onSetup={async (result) => {
                            if (result.type === 'user') {
                                return handleLoginUser(result);
                            }
                            if (result.type === 'signup') {
                                return handleFinalizeSignup(result.payload);
                            }
                        }}
                    />
                )}
            </UnAuthenticated>
        </PublicThemeProvider>
    );
};
export default SingleSignupContainerV2;
