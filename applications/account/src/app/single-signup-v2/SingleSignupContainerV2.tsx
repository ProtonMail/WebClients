import type { ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import type { OnLoginCallback } from '@proton/components';
import {
    StandardLoadErrorPage,
    UnAuthenticated,
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
    useModalState,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import type { AuthSession } from '@proton/components/containers/login/interface';
import { useIsChargebeeEnabled } from '@proton/components/containers/payments/PaymentSwitcher';
import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/components/containers/payments/TaxCountrySelector';
import { getMaybeForcePaymentsVersion } from '@proton/components/payments/client-extensions';
import { usePaymentsTelemetry } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import type { PaymentMethodFlows } from '@proton/components/payments/core';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import type { PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getFreePlan, queryPlans } from '@proton/shared/lib/api/payments';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getUser } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import { getIsPassApp } from '@proton/shared/lib/authentication/apps';
import type {
    LocalSessionPersisted,
    ResumedSessionResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { sendExtensionMessage } from '@proton/shared/lib/browser/extension';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import {
    APPS,
    BRAND_NAME,
    CYCLE,
    DEFAULT_CURRENCY,
    PLANS,
    REFERRER_CODE_MAIL_TRIAL,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { humanPriceWithCurrency } from '@proton/shared/lib/helpers/humanPrice';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPlanFromPlanIDs, getPlanNameFromIDs, hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage, traceError } from '@proton/shared/lib/helpers/sentry';
import type { Cycle, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import type { User } from '@proton/shared/lib/interfaces/User';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';
import { defaultVPNServersCountData, getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import mailReferPage from '../../pages/refer-a-friend';
import mailTrialPage from '../../pages/trial';
import { PublicThemeProvider, getPublicTheme } from '../containers/PublicThemeProvider';
import type { Paths } from '../content/helper';
import { isMailReferAFriendSignup, isMailTrialSignup } from '../signup/helper';
import type {
    InviteData,
    SessionData,
    SignupCacheResult,
    SubscriptionData,
    UserCacheResult,
} from '../signup/interfaces';
import { getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import { handleSetupMnemonic, handleSetupUser, handleSubscribeUser } from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import Layout from './Layout';
import LoginModal from './LoginModal';
import type { Step1Rref } from './Step1';
import Step1 from './Step1';
import Step2 from './Step2';
import SwitchModal from './SwitchModal';
import { getDriveConfiguration } from './drive/configuration';
import { getGenericConfiguration } from './generic/configuration';
import {
    getFreeSubscriptionData,
    getHasBusinessUpsell,
    getPlanCardSubscriptionData,
    getRelativeUpsellPrice,
    getSessionDataFromSignup,
    getUserInfo,
} from './helper';
import type { SignupModelV2, SignupParameters2, Upsell } from './interface';
import { SignupMode, Steps, UpsellTypes } from './interface';
import { getMailConfiguration } from './mail/configuration';
import type { TelemetryMeasurementData } from './measure';
import { getPaymentMethodsAvailable, getPlanNameFromSession, getSignupTelemetryData } from './measure';
import AccessModal from './modals/AccessModal';
import SubUserModal from './modals/SubUserModal';
import UnlockModal from './modals/UnlockModal';
import VisionaryUpsellModal from './modals/VisionaryUpsellModal';
import { getPassConfiguration } from './pass/configuration';
import { getWalletConfiguration } from './wallet/configuration';

const getRecoveryKit = async () => {
    // Note: This chunkName is important as it's used in the chunk plugin to avoid splitting it into multiple files
    return import(/* webpackChunkName: "recovery-kit" */ '@proton/recovery-kit');
};

const getDefaultSubscriptionData = (cycle: Cycle): SubscriptionData => {
    return {
        skipUpsell: false,
        currency: DEFAULT_CURRENCY,
        cycle,
        planIDs: {},
        checkResult: getFreeCheckResult(),
        billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
    };
};

const subscriptionDataCycleMapping = {
    [PLANS.FREE]: {
        [CYCLE.MONTHLY]: getDefaultSubscriptionData(CYCLE.MONTHLY),
        [CYCLE.YEARLY]: getDefaultSubscriptionData(CYCLE.YEARLY),
        [CYCLE.TWO_YEARS]: getDefaultSubscriptionData(CYCLE.TWO_YEARS),
        [CYCLE.FIFTEEN]: getDefaultSubscriptionData(CYCLE.FIFTEEN),
        [CYCLE.THIRTY]: getDefaultSubscriptionData(CYCLE.THIRTY),
    },
};

export const defaultUpsell: Upsell = {
    mode: UpsellTypes.PLANS,
    currentPlan: undefined,
    unlockPlan: undefined,
    plan: undefined,
    subscriptionOptions: {},
};
export const defaultSignupModel: SignupModelV2 = {
    session: undefined,
    domains: [],
    subscriptionData: subscriptionDataCycleMapping[PLANS.FREE][CYCLE.YEARLY],
    subscriptionDataCycleMapping,
    paymentMethodStatusExtended: {
        VendorStates: {
            Card: false,
            Paypal: false,
            Apple: false,
            Cash: false,
            Bitcoin: false,
        },
    },
    humanVerificationMethods: [],
    humanVerificationToken: '',
    selectedProductPlans: {
        [Audience.B2C]: PLANS.MAIL,
        [Audience.B2B]: PLANS.MAIL_PRO,
        [Audience.FAMILY]: PLANS.FAMILY,
    },
    freePlan: FREE_PLAN,
    upsell: defaultUpsell,
    inviteData: undefined,
    plans: [],
    plansMap: {},
    referralData: undefined,
    step: Steps.Account,
    cache: undefined,
    optimistic: {},
    vpnServersCountData: defaultVPNServersCountData,
};

interface Props {
    initialSearchParams?: URLSearchParams;
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
    initialSearchParams,
    paths,
    metaTags,
    fork,
    toApp,
    activeSessions,
    loader,
    onLogin,
    productParam,
    clientType,
}: Props) => {
    const ktActivation = useKTActivation();
    const { APP_NAME } = useConfig();
    const visionarySignupEnabled = useFlag('VisionarySignup');

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
    useMetaTags(isMailRefer ? mailReferPage() : isMailTrial ? mailTrialPage() : metaTags);

    const [model, setModel] = useState<SignupModelV2>(defaultSignupModel);
    const step1Ref = useRef<Step1Rref | undefined>(undefined);

    const setModelDiff = useCallback((diff: Partial<SignupModelV2>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    }, []);

    // Override the app to always be mail in trial or refer-a-friend signup
    if (isMailTrial || isMailRefer) {
        toApp = APPS.PROTONMAIL;
    }

    const unauthApi = useApi();
    const { getPaymentsApi } = usePaymentsApi();
    const isChargebeeEnabled = useIsChargebeeEnabled();
    const { reportPaymentSuccess, reportPaymentFailure } = usePaymentsTelemetry({
        flow: 'signup-pass',
    });
    const UID = model.session?.UID;
    const normalApi = UID ? getUIDApi(UID, unauthApi) : unauthApi;
    const silentApi = getSilentApi(normalApi);
    const [error, setError] = useState<any>();
    const vpnServersCountData = model.vpnServersCountData;
    const handleError = useErrorHandler();
    const [tmpLoginEmail, setTmpLoginEmail] = useState('');
    const [switchModalProps, setSwitchModal, renderSwitchModal] = useModalState();
    const [loginModalProps, setLoginModal, renderLoginModal] = useModalState();
    const { viewportWidth } = useActiveBreakpoint();

    const [unlockModalProps, setUnlockModal, renderUnlockModal] = useModalState();
    const [visionaryModalProps, setVisionaryModal, renderVisionaryModal] = useModalState();
    const [subUserModalProps, setSubUserModal, renderSubUserModal] = useModalState();
    const [accessModalProps, setHasAccessModal, renderAccessModal] = useModalState();

    const [loadingDependencies, withLoadingDependencies] = useLoading(true);
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const [signupParameters, setSignupParameters] = useState((): SignupParameters2 => {
        const searchParams = new URLSearchParams(location.search);
        if (toApp !== APPS.PROTONWALLET && !visionarySignupEnabled && searchParams.get('plan') === PLANS.VISIONARY) {
            searchParams.delete('plan');
        }
        const result = getSignupSearchParams(location.pathname, searchParams);
        if (!result.email && initialSearchParams) {
            result.email = initialSearchParams.get('email') || result.email;
        }

        let localID = Number(searchParams.get('u'));
        let mode = searchParams.get('mode') === SignupMode.Onboarding ? SignupMode.Onboarding : SignupMode.Default;

        // pass new user invite
        const inviter = searchParams.get('inviter');
        const invitee = searchParams.get('invitee') || searchParams.get('invited');
        let invite: SignupParameters2['invite'] = undefined;

        const preVerifiedAddressToken = searchParams.get('preVerifiedAddressToken') || undefined;

        if (getIsPassApp(toApp) && invitee && inviter) {
            mode = SignupMode.Invite;
            localID = -1;
            invite = {
                type: 'pass',
                data: { inviter, invitee, preVerifiedAddressToken },
            };
        }

        // Due to the scribe addon and drive b2b complexity in dealing with signed in users we'll temporarily disable it
        let signIn: SignupParameters2['signIn'] = 'standard';
        if (
            [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE].includes(toApp as any) ||
            productParam === 'generic'
        ) {
            localID = -1;
            signIn = 'redirect';
        }

        if (isMailTrial) {
            result.referrer = REFERRER_CODE_MAIL_TRIAL;
        }

        const externalInvitationID = searchParams.get('externalInvitationID');
        const email = result.email;
        if (toApp === APPS.PROTONDRIVE && externalInvitationID && email && preVerifiedAddressToken) {
            mode = SignupMode.Invite;
            localID = -1;
            invite = {
                type: 'drive',
                data: { invitee: email, externalInvitationID, preVerifiedAddressToken },
            };
            result.preSelectedPlan = PLANS.FREE;
        }

        if (toApp === APPS.PROTONWALLET && email && preVerifiedAddressToken) {
            mode = SignupMode.Invite;
            localID = -1;
            invite = {
                type: 'wallet',
                data: { invitee: email, preVerifiedAddressToken },
            };
            result.preSelectedPlan = PLANS.FREE;
        } else if (
            toApp === APPS.PROTONWALLET &&
            // If it's not visionary or wallet, force free selection
            !new Set([PLANS.VISIONARY, PLANS.WALLET]).has(result.preSelectedPlan as any)
        ) {
            // TODO: WalletEA
            result.preSelectedPlan = PLANS.FREE;
        }

        if (result.referrer) {
            mode = SignupMode.MailReferral;
            localID = -1;
            result.cycle = CYCLE.MONTHLY;
            result.hideFreePlan = false;

            invite = {
                type: 'mail',
                data: {
                    referrer: result.referrer,
                    invite: result.invite,
                },
            };
        }

        if (location.state?.invite) {
            mode = SignupMode.Default;
            localID = -1;
            result.hideFreePlan = false;
            invite = {
                type: 'generic',
                data: {
                    selector: location.state.invite.selector,
                    token: location.state.invite.token,
                },
            };
        }

        return {
            ...result,
            localID: Number.isInteger(localID) ? localID : undefined,
            signIn,
            mode,
            invite,
        };
    });

    const theme = getPublicTheme(toApp, audience, viewportWidth);

    const signupConfiguration = (() => {
        const planIDs = model.optimistic.planIDs || model.subscriptionData.planIDs;
        const plan = getPlanFromPlanIDs(model.plansMap, planIDs) || FREE_PLAN;

        if (toApp === APPS.PROTONDRIVE || toApp === APPS.PROTONDOCS) {
            return getDriveConfiguration({
                audience,
                freePlan: model.freePlan,
                mode: signupParameters.mode,
                plansMap: model.plansMap,
                isLargeViewport: viewportWidth['>=large'],
                hideFreePlan: signupParameters.hideFreePlan,
            });
        }
        if (toApp === APPS.PROTONMAIL || toApp === APPS.PROTONCALENDAR) {
            return getMailConfiguration({
                audience,
                mode: signupParameters.mode,
                plan,
                planParameters: model.planParameters,
                plansMap: model.plansMap,
                isLargeViewport: viewportWidth['>=large'],
                vpnServersCountData,
                hideFreePlan: signupParameters.hideFreePlan,
                freePlan: model.freePlan,
            });
        }
        if (getIsPassApp(toApp)) {
            return getPassConfiguration({
                audience,
                isLargeViewport: viewportWidth['>=large'],
                vpnServersCountData,
                hideFreePlan: signupParameters.hideFreePlan,
                mode: signupParameters.mode,
                isPaidPassVPNBundle: !!planIDs[PLANS.VPN_PASS_BUNDLE],
                isPaidPass: [
                    PLANS.VISIONARY,
                    PLANS.FAMILY,
                    PLANS.BUNDLE,
                    PLANS.BUNDLE_PRO,
                    PLANS.BUNDLE_PRO_2024,
                    PLANS.VPN_PASS_BUNDLE,
                    PLANS.PASS,
                    PLANS.PASS_BUSINESS,
                    PLANS.PASS_PRO,
                ].some((plan) => planIDs[plan]),
            });
        }
        if (toApp === APPS.PROTONWALLET) {
            return getWalletConfiguration({
                audience,
                plan,
                signedIn: Boolean(model.session),
                isLargeViewport: viewportWidth['>=large'],
                vpnServersCountData,
                hideFreePlan: signupParameters.hideFreePlan,
                mode: signupParameters.mode,
            });
        }
        return getGenericConfiguration({
            theme,
            audience,
            mode: signupParameters.mode,
            plan,
            freePlan: model.freePlan,
            planParameters: model.planParameters,
            plansMap: model.plansMap,
            isLargeViewport: viewportWidth['>=large'],
            vpnServersCountData,
            hideFreePlan: signupParameters.hideFreePlan,
        });
    })();
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
            if (getIsPassApp(toApp)) {
                if (signupParameters.mode === SignupMode.Onboarding) {
                    return 'pass_web_first_onboard';
                }
                if (audience === Audience.B2B) {
                    return 'pass_signup_b2b';
                }
                return 'pass_signup';
            }
            if (productParam === 'business') {
                return 'business_signup';
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
        }).catch(noop);
    };

    const upsellPlanCard = planCards[audience].find((planCard) => planCard.type === 'best');

    const triggerModals = (
        session: SessionData,
        upsell: Upsell,
        subscriptionData: SubscriptionData,
        options?: {
            ignoreUnlock: boolean;
        }
    ) => {
        const planName = getPlanNameFromSession(session);

        if (session.state.access) {
            setHasAccessModal(true);
            return;
        }

        if (session.organization && !session.state.payable) {
            if (getHasBusinessUpsell(planName)) {
                setSubUserModal(true);
                return;
            }
        }

        if (session.subscription && options?.ignoreUnlock !== true && upsell.plan?.Name) {
            const hasCheckResult = subscriptionData.planIDs[upsell.plan.Name];
            // If this plan was not selected through a query parameter, e.g. that we overrode it to something else, because it fits
            // the copy of the unlock modal better.
            if (signupParameters.preSelectedPlan === upsell.plan.Name || !hasCheckResult) {
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
                resumedSession = await resumeSession({
                    api: silentApi,
                    localID: maybeSession?.persisted.localID,
                }).catch(noop);
                if (resumedSession) {
                    silentApi = getUIDApi(resumedSession.UID, silentApi);
                }
            }

            let chargebeeEnabled = undefined;
            if (resumedSession?.UID && resumedSession?.User) {
                const user: User = resumedSession.User;
                chargebeeEnabled = await isChargebeeEnabled(resumedSession?.UID, async () => user);
            }
            const paymentsApi = getPaymentsApi(silentApi, chargebeeEnabled?.result);

            const forcePaymentsVersion = getMaybeForcePaymentsVersion(resumedSession?.User);
            const plans = await silentApi<{ Plans: Plan[] }>(
                queryPlans(
                    signupParameters.currency
                        ? {
                              Currency: signupParameters.currency,
                          }
                        : undefined,
                    forcePaymentsVersion
                )
            ).then(({ Plans }) => Plans);
            const planParameters = getPlanIDsFromParams(plans, signupParameters, defaults);
            const currency = signupParameters.currency || plans?.[0]?.Currency || DEFAULT_CURRENCY;
            const cycle = signupParameters.cycle || defaults.cycle;
            const invite = signupParameters.invite;
            const coupon = signupParameters.coupon;

            const plansMap = toMap(plans, 'Name') as PlansMap;

            getVPNServersCountData(silentApi).then((vpnServersCountData) => setModelDiff({ vpnServersCountData }));

            const [
                { Domains: domains },
                paymentMethodStatus,
                referralData,
                { subscriptionData, upsell, ...userInfo },
                freePlan,
                subscriptionDataCycleMapping,
            ] = await Promise.all([
                silentApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                paymentsApi.statusExtendedAutomatic(),
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
                    signupParameters,
                    options: {
                        plansMap: plansMap,
                        planIDs: planParameters.planIDs,
                        currency,
                        cycle,
                        coupon,
                        billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
                    },
                    toApp: product,
                }),
                getFreePlan({ api: silentApi }),
                (async () => {
                    const [b2b, b2c] = await Promise.all(
                        ([Audience.B2C, Audience.B2B] as const).map((audienceToFetch) => {
                            const planIDs = planCards[audienceToFetch].map(({ plan }) => ({ [plan]: 1 }));
                            return getPlanCardSubscriptionData({
                                planIDs,
                                plansMap,
                                cycles: signupConfiguration.cycles,
                                paymentsApi,
                                coupon,
                                currency,
                                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
                            });
                        })
                    );
                    return { ...b2b, ...b2c };
                })(),
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
                    clientKey: resumedSession.clientKey,
                    offlineKey: resumedSession.offlineKey,
                    ...userInfo,
                };
            }

            const signupParametersDiff: Partial<SignupParameters2> = {};
            if (signupParameters.mode === SignupMode.Onboarding && !session?.user) {
                signupParametersDiff.mode = SignupMode.Default;
            }
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
            const mode = signupParametersDiff.mode || signupParameters.mode;

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
            });

            if (session?.user) {
                setLoadingChallenge(false);

                if (product === APPS.PROTONPASS) {
                    const onboardingMode = mode === SignupMode.Onboarding;

                    if (onboardingMode && hasPaidPass(session.user)) {
                        const freeSubscriptionData = getFreeSubscriptionData(subscriptionData);
                        const cache: UserCacheResult = {
                            type: 'user',
                            subscriptionData: freeSubscriptionData,
                            session,
                        };
                        setModelDiff({ subscriptionData: cache.subscriptionData, cache, step: Steps.Loading });
                    } else {
                        triggerModals(session, upsell, subscriptionData, { ignoreUnlock: onboardingMode });
                    }
                } else {
                    triggerModals(session, upsell, subscriptionData, { ignoreUnlock: false });
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
                dimensions: getPaymentMethodsAvailable(paymentMethodStatus.VendorStates),
            });
        };

        void withLoadingDependencies(
            fetchDependencies().catch((error) => {
                setError(error);
            })
        );

        return () => {};
    }, []);

    const accountRef = useRef({ signingOut: false, signingIn: false });

    const handleSignOut = async (reset = false) => {
        if (!model.plans.length || accountRef.current.signingIn || accountRef.current.signingOut) {
            return;
        }

        try {
            accountRef.current.signingOut = true;
            await startUnAuthFlow();

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
                    planCards[audience].some((planCard) => previousPlanIDs[planCard.plan] > 0)
                ) {
                    return previousPlanIDs;
                }
                return model.planParameters?.planIDs;
            })();

            let cycle = signupParameters.cycle || model.subscriptionData.cycle;
            if (!signupConfiguration.cycles.includes(cycle)) {
                cycle = signupConfiguration.defaults.cycle;
            }

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

    const handleSignIn = async (authSession: AuthSession, options?: { ignore?: boolean }) => {
        if (
            !model.plans.length ||
            (!options?.ignore && accountRef.current.signingIn) ||
            accountRef.current.signingOut
        ) {
            return;
        }

        try {
            accountRef.current.signingIn = true;
            // Override the silentApi to not use the one with the UID as we prepare the state
            const silentApi = getSilentApi(getUIDApi(authSession.UID, unauthApi));

            const [user] = await Promise.all([
                authSession.User || silentApi<{ User: User }>(getUser()).then(({ User }) => User),
            ]);

            const chargebeeEnabled = await isChargebeeEnabled(authSession.UID, async () => user);

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
                    cycle: model.subscriptionData.cycle,
                    currency: model.subscriptionData.currency,
                    planIDs: model.subscriptionData.planIDs,
                    coupon: model.subscriptionData.checkResult?.Coupon?.Code,
                    billingAddress: model.subscriptionData.billingAddress,
                },
                toApp: product,
            });

            const session: SessionData = {
                user,
                UID: authSession.UID,
                localID: authSession.LocalID,
                keyPassword: authSession.keyPassword,
                trusted: authSession.trusted,
                persistent: authSession.persistent,
                clientKey: authSession.clientKey,
                offlineKey: authSession.offlineKey,
                ...userInfo,
            };

            setModelDiff({
                optimistic: {},
                session,
                cache: undefined,
                subscriptionData,
                upsell,
            });

            triggerModals(session, upsell, subscriptionData);
            measure({
                event: TelemetryAccountSignupEvents.beSignInSuccess,
                dimensions: { plan: getPlanNameFromSession(session) },
            });
        } finally {
            accountRef.current.signingIn = false;
        }
    };

    const handleSwitchSession = async (session: LocalSessionPersisted) => {
        if (!model.plans.length || accountRef.current.signingIn || accountRef.current.signingOut) {
            return;
        }
        try {
            accountRef.current.signingIn = true;
            const silentApi = getSilentApi(unauthApi);
            const resumedSession = await resumeSession({ api: silentApi, localID: session.persisted.localID });
            if (resumedSession) {
                return await handleSignIn(resumedSession, { ignore: true });
            }
        } finally {
            accountRef.current.signingIn = false;
        }
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

    const handleLoginUser = async (cache: UserCacheResult) => {
        try {
            await onLogin({
                UID: cache.session.UID,
                keyPassword: cache.session.keyPassword,
                flow: 'login',
                LocalID: cache.session.localID,
                User: cache.session.user,
                trusted: cache.session.trusted,
                persistent: cache.session.persistent,
                clientKey: cache.session.clientKey,
                offlineKey: cache.session.offlineKey,
            });
        } catch (error) {
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
            ? humanPriceWithCurrency(
                  relativePricePerMonth,
                  model.optimistic.currency || model.subscriptionData.currency
              )
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
            await handleSubscribeUser(
                silentApi,
                cache.subscriptionData,
                undefined,
                productParam,
                getReportPaymentSuccess(cache.subscriptionData, !!model.session?.UID),
                getReportPaymentFailure(cache.subscriptionData, !!model.session?.UID)
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

        const [result] = await Promise.all([
            handleSetupUser({
                cache,
                api: silentApi,
                ignoreVPN: true,
                setupMnemonic,
                reportPaymentSuccess: getReportPaymentSuccess(cache.subscriptionData, !!model.session?.UID),
                reportPaymentFailure: getReportPaymentFailure(cache.subscriptionData, !!model.session?.UID),
            }),
            wait(3500),
        ]);

        measure(getSignupTelemetryData(model.plansMap, cache));

        return result.cache;
    };

    return (
        <PublicThemeProvider value={theme}>
            {preload}
            {renderLoginModal && (
                <LoginModal
                    productParam={productParam}
                    paths={paths}
                    {...loginModalProps}
                    defaultUsername={tmpLoginEmail}
                    onLogin={async (props) => {
                        await handleSignIn(props);
                        setLoginModal(false);
                        return { state: 'input' };
                    }}
                />
            )}
            {renderSwitchModal && (
                <SwitchModal
                    user={model.session?.user}
                    sessions={activeSessions}
                    {...switchModalProps}
                    onSwitchSession={async (props) => {
                        await handleSwitchSession(props);
                        setSwitchModal(false);
                    }}
                />
            )}
            {(loadingDependencies || loadingChallenge) && <>{loader}</>}
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
                        signupConfiguration={signupConfiguration}
                        activeSessions={activeSessions}
                        signupParameters={signupParameters}
                        relativePrice={relativePrice}
                        step1Ref={step1Ref}
                        className={loadingDependencies || loadingChallenge ? 'visibility-hidden' : undefined}
                        isLargeViewport={viewportWidth['>=large']}
                        api={normalApi}
                        measure={measure}
                        currentPlan={model.upsell.currentPlan}
                        onOpenSwitch={() => {
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
                        onChallengeError={() => {
                            // Ignore errors that were caused when there's a user and it's not being signed out
                            if (model.session?.user && !accountRef.current.signingOut) {
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
                                    ignoreExplore: toApp !== undefined,
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
                            } catch (error: any) {
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
                                            throw new Error('Not implemented');
                                        }
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
                                try {
                                    await onLogin(result.payload.session);
                                } catch (error) {
                                    handleError(error);
                                }
                            }
                        }}
                    />
                )}
            </UnAuthenticated>
        </PublicThemeProvider>
    );
};
export default SingleSignupContainerV2;
