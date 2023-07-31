import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import {
    FeatureCode,
    OnLoginCallback,
    StandardLoadErrorPage,
    UnAuthenticated,
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
    useModalState,
    useVPNServersCount,
} from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import { AuthSession } from '@proton/components/containers/login/interface';
import { PAYMENT_METHOD_TYPES, PaymentMethodStatus } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { updateFeatureValue } from '@proton/shared/lib/api/features';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryPaymentMethodStatus, queryPlans } from '@proton/shared/lib/api/payments';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getUser } from '@proton/shared/lib/api/user';
import { getExtension } from '@proton/shared/lib/apps/helper';
import { ProductParam, normalizeProduct } from '@proton/shared/lib/apps/product';
import {
    LocalSessionPersisted,
    ResumedSessionResult,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    CLIENT_TYPES,
    DEFAULT_CURRENCY,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    PLANS,
} from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import { Audience, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import type { User } from '@proton/shared/lib/interfaces/User';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { Paths } from '../content/helper';
import { getPlanFromPlanIDs } from '../signup/helper';
import { SessionData, SignupCacheResult, SubscriptionData, UserCacheResult } from '../signup/interfaces';
import { getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import { handleDone, handleSetupMnemonic, handleSetupUser, handleSubscribeUser } from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import { MetaTags, useMetaTags } from '../useMetaTags';
import LoginModal from './LoginModal';
import Step1, { Step1Rref } from './Step1';
import Step2 from './Step2';
import {
    getFreeSubscriptionData,
    getFreeTitle,
    getHasBusinessUpsell,
    getHasUnlimitedUpsell,
    getRelativeUpsellPrice,
    getSessionDataFromSignup,
    getUserInfo,
} from './helper';
import { SignupMode, SignupModelV2, Steps, UpsellTypes } from './interface';
import {
    TelemetryMeasurementData,
    getPaymentMethodsAvailable,
    getPlanNameFromSession,
    getSignupTelemetryData,
} from './measure';
import AccessModal from './modals/AccessModal';
import SubUserModal from './modals/SubUserModal';
import UnlockModal from './modals/UnlockModal';
import { getPassConfiguration } from './pass/configuration';

const getRecoveryKit = async () => {
    // Note: This chunkName is important as it's used in the chunk plugin to avoid splitting it into multiple files
    return import(/* webpackChunkName: "recovery-kit" */ '@proton/recovery-kit');
};

export const defaultSignupModel: SignupModelV2 = {
    session: undefined,
    domains: [],
    subscriptionData: {
        skipUpsell: false,
        currency: 'EUR',
        cycle: 12,
        planIDs: {},
        checkResult: getFreeCheckResult(),
    },
    paymentMethodStatus: {
        Card: false,
        Paypal: false,
        Apple: false,
        Cash: false,
        Bitcoin: false,
    },
    humanVerificationMethods: [],
    humanVerificationToken: '',
    selectedProductPlans: {
        [Audience.B2C]: PLANS.MAIL,
        [Audience.B2B]: PLANS.MAIL_PRO,
        [Audience.FAMILY]: PLANS.FAMILY,
    },
    upsell: {
        mode: UpsellTypes.PLANS,
        currentPlan: undefined,
        unlockPlan: undefined,
        plan: undefined,
    },
    inviteData: undefined,
    plans: [],
    plansMap: {},
    referralData: undefined,
    step: Steps.Account,
    cache: undefined,
    optimistic: {},
};

interface Props {
    loader: ReactNode;
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp?: APP_NAMES;
    toAppName?: string;
    onBack?: () => void;
    clientType: CLIENT_TYPES;
    activeSessions?: LocalSessionPersisted[];
    fork: boolean;
    metaTags: MetaTags;
    paths: Paths;
}

let ranPreload = false;

const SingleSignupContainerV2 = ({
    paths,
    metaTags,
    fork,
    activeSessions,
    loader,
    onLogin,
    productParam,
    clientType,
}: Props) => {
    const location = useLocationWithoutLocale();
    const ktActivation = useKTActivation();
    const { APP_NAME } = useConfig();

    useMetaTags(metaTags);

    const [model, setModel] = useState<SignupModelV2>(defaultSignupModel);
    const step1Ref = useRef<Step1Rref | undefined>(undefined);

    const setModelDiff = useCallback((diff: Partial<SignupModelV2>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    }, []);

    const unauthApi = useApi();

    const UID = model.session?.UID;
    const normalApi = UID ? getUIDApi(UID, unauthApi) : unauthApi;
    const silentApi = getSilentApi(normalApi);
    const [error, setError] = useState<any>();
    const [vpnServersCountData] = useVPNServersCount();
    const handleError = useErrorHandler();
    const [tmpLoginEmail, setTmpLoginEmail] = useState('');
    const [loginModalProps, setLoginModal, renderLoginModal] = useModalState();
    const { isDesktop } = useActiveBreakpoint();

    const [unlockModalProps, setUnlockModal, renderUnlockModal] = useModalState();
    const [subUserModalProps, setSubUserModal, renderSubUserModal] = useModalState();
    const [accessModalProps, setHasAccessModal, renderAccessModal] = useModalState();

    const [loadingDependencies, withLoadingDependencies] = useLoading(true);
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const {
        logo,
        features,
        titles,
        planCards,
        benefits,
        product,
        shortAppName,
        productAppName,
        preload,
        setupImg,
        defaults,
        generateMnemonic,
        CustomStep,
    } = getPassConfiguration({
        isDesktop,
    });

    useEffect(() => {
        const run = async () => {
            // In the main container so that it's ready, but can potentially be moved to custom step
            const extension = getExtension(APPS.PROTONPASSBROWSEREXTENSION);
            if (!extension) {
                return;
            }
            const result = await sendExtensionMessage<{ type: 'pass-installed' }>(
                { type: 'pass-installed' },
                { extensionId: extension.ID, maxTimeout: 1000 }
            ).catch(noop);
            setModelDiff({
                extension: {
                    ID: extension.ID,
                    installed: result?.type === 'success',
                },
            });
        };
        run();
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

    const [signupParameters] = useState(() => {
        const searchParams = new URLSearchParams(location.search);
        const result = getSignupSearchParams(location.pathname, searchParams, {
            cycle: defaults.cycle,
            preSelectedPlan: defaults.plan,
        });

        const validValues = ['free', ...planCards.map((planCard) => planCard.plan)];
        if (result.preSelectedPlan && !validValues.includes(result.preSelectedPlan)) {
            delete result.preSelectedPlan;
        }

        const localID = Number(searchParams.get('u'));
        const mode = searchParams.get('mode') === SignupMode.Onboarding ? SignupMode.Onboarding : SignupMode.Default;

        return {
            ...result,
            localID: Number.isInteger(localID) ? localID : undefined,
            mode,
        };
    });

    const measure = (data: TelemetryMeasurementData) => {
        const values = 'values' in data ? data.values : {};
        return sendTelemetryReport({
            api: unauthApi,
            measurementGroup: TelemetryMeasurementGroups.accountSignup,
            event: data.event,
            dimensions: {
                ...data.dimensions,
                flow: signupParameters.mode === SignupMode.Onboarding ? 'pass_web_first_onboard' : 'pass_signup',
            },
            values,
        }).catch(noop);
    };

    const selectedPlan = getPlanFromPlanIDs(model.plans, model.subscriptionData.planIDs) || FREE_PLAN;
    const upsellPlanCard = planCards.find((planCard) => planCard.type === 'best');

    const triggerModals = (session: SessionData, options?: { ignoreUnlock: boolean }) => {
        const planName = getPlanNameFromSession(session);

        if (session.user && hasPaidPass(session.user)) {
            setHasAccessModal(true);
            return;
        }

        if (session.organization && !session.state.payable) {
            if (getHasBusinessUpsell(planName)) {
                setSubUserModal(true);
                return;
            }
        }

        if (session.subscription && options?.ignoreUnlock !== true) {
            if (getHasUnlimitedUpsell(planName) || getHasBusinessUpsell(planName)) {
                setUnlockModal(true);
                return;
            }
        }
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            await startUnAuthFlow().catch(noop);

            const maybeSession = (() => {
                if (signupParameters.localID === -1 || !activeSessions?.length) {
                    return undefined;
                }
                return (
                    activeSessions.find((session) => session.persisted.localID === signupParameters.localID) ||
                    activeSessions[0]
                );
            })();

            let silentApi = getSilentApi(unauthApi);
            let resumedSession: ResumedSessionResult | undefined;

            if (maybeSession?.persisted.UID) {
                // Try to resume the session first so that in case it's expired, the rest of the flow is fine.
                resumedSession = await resumeSession(silentApi, maybeSession?.persisted.localID).catch(noop);
                if (resumedSession) {
                    silentApi = getUIDApi(resumedSession.UID, silentApi);
                }
            }

            const plans = await silentApi<{ Plans: Plan[] }>(
                queryPlans(
                    signupParameters.currency
                        ? {
                              Currency: signupParameters.currency,
                          }
                        : undefined
                )
            ).then(({ Plans }) => Plans);
            const prePlanIDs = getPlanIDsFromParams(plans, signupParameters);
            const currency = signupParameters.currency || plans?.[0]?.Currency || DEFAULT_CURRENCY;

            const plansMap = toMap(plans, 'Name') as PlansMap;

            const [{ Domains: domains }, paymentMethodStatus, { subscriptionData, upsell, ...userInfo }] =
                await Promise.all([
                    silentApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                    silentApi<PaymentMethodStatus>(queryPaymentMethodStatus()),
                    getUserInfo({
                        api: silentApi,
                        user: resumedSession?.User,
                        plans,
                        plansMap,
                        upsellPlanCard,
                        options: {
                            planIDs: prePlanIDs,
                            currency,
                            cycle: signupParameters.cycle,
                            minimumCycle: signupParameters.minimumCycle,
                            coupon: signupParameters.coupon,
                        },
                    }),
                ]);

            let session: SessionData | undefined;
            if (resumedSession) {
                session = {
                    user: resumedSession.User,
                    UID: resumedSession.UID,
                    keyPassword: resumedSession.keyPassword,
                    localID: resumedSession.LocalID,
                    persistent: resumedSession.persistent,
                    trusted: resumedSession.trusted,
                    ...userInfo,
                };
            }

            setModelDiff({
                session,
                domains,
                upsell,
                plans,
                plansMap,
                paymentMethodStatus,
                subscriptionData,
                cache: undefined,
            });

            if (session?.user) {
                setLoadingChallenge(false);
                const onboardingMode = signupParameters.mode === SignupMode.Onboarding;
                if (onboardingMode && hasPaidPass(session.user)) {
                    const freeSubscriptionData = getFreeSubscriptionData(subscriptionData);
                    const cache: UserCacheResult = {
                        type: 'user',
                        subscriptionData: freeSubscriptionData,
                        session,
                    };
                    setModelDiff({ subscriptionData: cache.subscriptionData, cache, step: Steps.Loading });
                } else {
                    triggerModals(session, { ignoreUnlock: onboardingMode });
                }

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
                dimensions: getPaymentMethodsAvailable(paymentMethodStatus),
            });
        };

        void withLoadingDependencies(
            fetchDependencies().catch((error) => {
                setError(error);
            })
        );

        return () => {};
    }, []);

    const signingOutRef = useRef(false);

    const handleSignOut = async (reset = false) => {
        if (!model.plans.length) {
            return;
        }

        try {
            signingOutRef.current = true;
            await startUnAuthFlow();

            // Override the silentApi to not use the one with the UID as we prepare the state
            const silentApi = getSilentApi(unauthApi);

            // Reset planIDs
            const planIDs = (() => {
                const previousPlanIDs = model.subscriptionData.planIDs;
                // We keep the previous plan IDs if no addon was added and if the selected plan is included in any of the offered plans.
                if (
                    !reset &&
                    Object.keys(previousPlanIDs).length <= 1 &&
                    planCards.some((planCard) => previousPlanIDs[planCard.plan] > 0)
                ) {
                    return previousPlanIDs;
                }
                return getPlanIDsFromParams(model.plans, signupParameters);
            })();

            const { subscriptionData, upsell } = await getUserInfo({
                api: silentApi,
                options: {
                    cycle: model.subscriptionData.cycle,
                    currency: model.subscriptionData.currency,
                    planIDs,
                    minimumCycle: signupParameters.minimumCycle,
                    coupon: signupParameters.coupon,
                },
                plans: model.plans,
                plansMap: model.plansMap,
                upsellPlanCard,
            });

            measure({ event: TelemetryAccountSignupEvents.beSignOutSuccess, dimensions: {} });

            setModelDiff({
                optimistic: {},
                session: undefined,
                cache: undefined,
                upsell,
                subscriptionData,
            });
        } finally {
            signingOutRef.current = false;
        }
    };

    const handleSignIn = async (authSession: AuthSession) => {
        if (!model.plans.length) {
            return;
        }

        // Override the silentApi to not use the one with the UID as we prepare the state
        const silentApi = getSilentApi(getUIDApi(authSession.UID, unauthApi));

        const [user] = await Promise.all([
            authSession.User || silentApi<{ User: User }>(getUser()).then(({ User }) => User),
        ]);

        const { subscriptionData, upsell, ...userInfo } = await getUserInfo({
            api: silentApi,
            user,
            plans: model.plans,
            plansMap: model.plansMap,
            upsellPlanCard,
            options: {
                cycle: model.subscriptionData.cycle,
                currency: model.subscriptionData.currency,
                planIDs: model.subscriptionData.planIDs,
                minimumCycle: signupParameters.minimumCycle,
                coupon: model.subscriptionData.checkResult?.Coupon?.Code,
            },
        });

        const session: SessionData = {
            user,
            UID: authSession.UID,
            localID: authSession.LocalID,
            keyPassword: authSession.keyPassword,
            trusted: authSession.trusted,
            persistent: authSession.persistent,
            ...userInfo,
        };

        setModelDiff({
            optimistic: {},
            session,
            cache: undefined,
            subscriptionData,
            upsell,
        });

        triggerModals(session);
        measure({
            event: TelemetryAccountSignupEvents.beSignInSuccess,
            dimensions: { plan: getPlanNameFromSession(session) },
        });
    };

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    const canGenerateMnemonic = (() => {
        const user = model.session?.user;
        if (user) {
            return false;
            //return generateMnemonic && isPrivate(user) && user.Keys.length > 0 && getCanReactiveMnemonic(user);
        }
        return generateMnemonic;
    })();

    const br = <br key="br" />;

    const handleStartUserOnboarding = async (subscriptionData: SubscriptionData) => {
        if (!model.session) {
            throw new Error('Missing user session');
        }
        const cache: UserCacheResult = {
            type: 'user',
            subscriptionData,
            session: model.session,
        };
        setModelDiff({ subscriptionData: cache.subscriptionData, cache, step: Steps.Loading });
    };

    const relativePricePerMonth = getRelativeUpsellPrice(
        model.upsell,
        model.plansMap,
        model.optimistic.cycle || model.subscriptionData.cycle
    );
    const relativePrice = getSimplePriceString(
        model.optimistic.currency || model.subscriptionData.currency,
        relativePricePerMonth,
        ''
    );

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

    const handleSetupExistingUser = async (cache: UserCacheResult) => {
        const setupMnemonic = await getMnemonicSetup();

        const getMnemonicData = async () => {
            if (!canGenerateMnemonic || !setupMnemonic.generate) {
                return;
            }
            const user = cache.session.user;
            const emailAddress = user.Email || user.Name || '';
            const mnemonicData = await handleSetupMnemonic({
                api: silentApi,
                setupMnemonic,
                user,
                keyPassword: cache.session.keyPassword,
                emailAddress,
            });
            return mnemonicData;
        };

        const run = async () => {
            await handleSubscribeUser(silentApi, cache.subscriptionData, undefined, productParam);

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

        const [result] = await Promise.all([
            handleSetupUser({
                cache,
                api: silentApi,
                ignoreVPN: true,
                setupMnemonic,
            }),
            wait(3500),
        ]);

        measure(getSignupTelemetryData(model.plans, cache));

        silentApi(updateFeatureValue(FeatureCode.PassSignup, true)).catch(noop);

        return result.cache;
    };

    return (
        <>
            {preload}
            {renderLoginModal && (
                <LoginModal
                    paths={paths}
                    {...loginModalProps}
                    defaultUsername={tmpLoginEmail}
                    onLogin={async (props) => {
                        await handleSignIn(props);
                        setLoginModal(false);
                    }}
                />
            )}
            {(loadingDependencies || loadingChallenge) && <>{loader}</>}
            {(() => {
                if (!renderUnlockModal) {
                    return null;
                }
                return (
                    <UnlockModal
                        {...unlockModalProps}
                        title={c('pass_signup_2023: Title')
                            .jt`All ${BRAND_NAME} Plus services.${br}One easy subscription.`}
                        currentPlan={model.upsell.currentPlan}
                        upsellPlan={model.upsell.plan}
                        unlockPlan={model.upsell.unlockPlan}
                        relativePrice={relativePrice}
                        free={getFreeTitle(PASS_SHORT_APP_NAME)}
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
                );
            })()}
            {renderAccessModal && (
                <AccessModal
                    {...accessModalProps}
                    plan={model.upsell.plan?.Title || ''}
                    appName={PASS_APP_NAME}
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
                    currentPlan={model.upsell.currentPlan}
                    appName={PASS_SHORT_APP_NAME}
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
            <UnAuthenticated>
                {model.step === Steps.Account && (
                    <Step1
                        relativePrice={relativePrice}
                        step1Ref={step1Ref}
                        className={loadingDependencies || loadingChallenge ? 'visibility-hidden' : undefined}
                        features={features}
                        isDesktop={isDesktop}
                        logo={logo}
                        titles={titles}
                        api={normalApi}
                        benefits={benefits}
                        measure={measure}
                        app={product}
                        shortAppName={shortAppName}
                        appName={productAppName}
                        selectedPlan={selectedPlan}
                        currentPlan={model.upsell.currentPlan}
                        planCards={planCards}
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
                        onChallengeError={() => {
                            // Ignore errors that were caused when there's a user and it's not being signed out
                            if (model.session?.user && !signingOutRef.current) {
                                return;
                            }
                            setError(new Error('Challenge error'));
                        }}
                        onChallengeLoaded={() => {
                            setLoadingChallenge(false);
                        }}
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
                                return;
                            }

                            try {
                                const { accountData, subscriptionData } = data;

                                await startUnAuthFlow().catch(noop);

                                const cache: SignupCacheResult = {
                                    type: 'signup',
                                    appName: APP_NAME,
                                    appIntent: undefined,
                                    productParam,
                                    // Internal app or oauth app or vpn
                                    ignoreExplore: true,
                                    accountData,
                                    subscriptionData,
                                    inviteData: model.inviteData,
                                    referralData: model.referralData,
                                    persistent: false,
                                    trusted: false,
                                    clientType,
                                    ktActivation,
                                };

                                if (data.type === 'signup-token') {
                                    const tmpCache = {
                                        ...cache,
                                        subscriptionData: getFreeSubscriptionData(subscriptionData),
                                    };
                                    const userCreationResult = await handleCreateUser({
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
                                    });
                                } else {
                                    const result = await handleCreateUser({ cache, api: silentApi, mode: 'cro' });
                                    setModelDiff({
                                        subscriptionData: result.cache.subscriptionData,
                                        cache: result.cache,
                                        step: Steps.Loading,
                                    });
                                }
                            } catch (error) {
                                handleError(error);
                            }
                        }}
                        hideFreePlan={signupParameters.hideFreePlan}
                        mode={signupParameters.mode}
                    />
                )}
                {model.step === Steps.Loading && (
                    <Step2
                        logo={logo}
                        steps={(() => {
                            const hasPlans = hasPlanIDs(model.subscriptionData.planIDs);
                            const hasPayment = hasPlans && model.subscriptionData.checkResult.AmountDue > 0;
                            const hasSession = !!model.session?.user;

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
                                    setModelDiff({
                                        cache: result,
                                        step: Steps.Custom,
                                    });
                                }
                                if (cache.type === 'signup') {
                                    const result = await handleSetupNewUser(cache);
                                    setModelDiff({
                                        cache: result,
                                        step: Steps.Custom,
                                    });
                                }
                            } catch (error) {
                                await startUnAuthFlow().catch(noop);
                                handleError(error);
                                setModelDiff({
                                    cache: undefined,
                                    step: Steps.Account,
                                });
                            }
                        }}
                    />
                )}
                {model.step === Steps.Custom && (
                    <CustomStep
                        measure={measure}
                        fork={fork}
                        model={model}
                        productAppName={productAppName}
                        setupImg={setupImg}
                        logo={logo}
                        onSetup={async () => {
                            const cache = model.cache;
                            if (!cache) {
                                throw new Error('Missing cache');
                            }

                            if (cache.type === 'user') {
                                try {
                                    await onLogin({
                                        UID: cache.session.UID,
                                        keyPassword: cache.session.keyPassword,
                                        flow: 'login',
                                        LocalID: cache.session.localID,
                                        User: cache.session.user,
                                        trusted: cache.session.trusted,
                                        persistent: cache.session.persistent,
                                    });
                                } catch (error) {
                                    handleError(error);
                                }
                            }

                            if (cache.type === 'signup') {
                                try {
                                    const result = await handleDone({ cache });
                                    await onLogin(result.session);
                                } catch (error) {
                                    handleError(error);
                                }
                            }
                        }}
                    />
                )}
            </UnAuthenticated>
        </>
    );
};
export default SingleSignupContainerV2;
