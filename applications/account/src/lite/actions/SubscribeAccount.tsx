import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    CalendarLogo,
    DriveLogo,
    Icon,
    Logo,
    MailLogo,
    PassLogo,
    ProtonLogo,
    Tooltip,
    VpnLogo,
    useFlag,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
} from '@proton/components';
import { InAppText } from '@proton/components/containers/payments/subscription/InAppPurchaseModal';
import SubscriptionContainer from '@proton/components/containers/payments/subscription/SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { ProductParam } from '@proton/shared/lib/apps/product';
import {
    APPS,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    COUPON_CODES,
    CURRENCIES,
    DRIVE_APP_NAME,
    HTTP_STATUS_CODE,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    PLANS,
    PLAN_TYPES,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getPlan, getUpgradedPlan, getValidCycle, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { Currency } from '@proton/shared/lib/interfaces';
import { canPay } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import broadcast, { MessageType } from '../broadcast';
import LiteBox from '../components/LiteBox';
import LiteLayout from '../components/LiteLayout';
import LiteLoaderPage from '../components/LiteLoaderPage';
import PromotionAlreadyApplied from '../components/PromotionAlreadyApplied';
import PromotionExpired from '../components/PromotionExpired';
import SubscribeAccountDone from '../components/SubscribeAccountDone';
import { SubscribeType } from '../types/SubscribeType';

import './SubscribeAccount.scss';

interface Props {
    redirect?: string | undefined;
    fullscreen?: boolean;
    searchParams: URLSearchParams;
    app: ProductParam;
}

const plusPlans = [PLANS.VPN, PLANS.MAIL, PLANS.DRIVE, PLANS.PASS_PLUS, PLANS.VPN_PASS_BUNDLE];

const SubscribeAccount = ({ app, redirect, searchParams }: Props) => {
    const onceCloseRef = useRef(false);
    const topRef = useRef<HTMLDivElement>(null);
    const [user] = useUser();

    const { Email, DisplayName, Name } = user;
    const nameToDisplay = Email || DisplayName || Name;

    const [type, setType] = useState<SubscribeType | undefined>(undefined);

    const [subscription, loadingSubscription] = useSubscription();
    const [plans = [], loadingPlans] = usePlans();
    const [organization, loadingOrganization] = useOrganization();
    const [error, setError] = useState({ title: '', message: '', error: '' });

    const bf2023IsExpiredFlag = useFlag('BF2023IsExpired');
    const bf2023OfferCheck = useFlag('BF2023OfferCheck');

    const canEdit = canPay(user);

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return (
            <LiteLayout searchParams={searchParams}>
                <LiteLoaderPage />
            </LiteLayout>
        );
    }

    // Error in usage (this action is not meant to be shown if it cannot be triggered, so untranslated.
    if (!canEdit) {
        return (
            <LiteLayout searchParams={searchParams} className="flex flex-justify-center flex-align-items-center">
                <LiteBox>Please contact the administrator of the organization to manage the subscription</LiteBox>
            </LiteLayout>
        );
    }

    const maybeStart = searchParams.get('start');
    const maybeType = searchParams.get('type');

    const cycleParam = parseInt(searchParams.get('cycle') as any, 10);
    const parsedCycle = cycleParam ? getValidCycle(cycleParam) : undefined;
    const coupon = searchParams.get('coupon') || undefined;

    const currencyParam = searchParams.get('currency')?.toUpperCase();
    const parsedCurrency =
        currencyParam && CURRENCIES.includes(currencyParam as any) ? (currencyParam as Currency) : undefined;

    const maybePlanName = searchParams.get('plan') || '';
    const plan =
        maybeType === 'upgrade'
            ? getUpgradedPlan(subscription, app)
            : (plans.find(({ Name, Type }) => Name === maybePlanName && Type === PLAN_TYPES.PLAN)?.Name as
                  | PLANS
                  | undefined);

    const { bgClassName, logo } = (() => {
        if (plan === PLANS.VPN) {
            return { bgClassName: 'subscribe-account--vpn-bg', logo: <Logo appName={APPS.PROTONVPN_SETTINGS} /> };
        }

        if (plan === PLANS.DRIVE || plan === PLANS.DRIVE_PRO) {
            return { bgClassName: 'subscribe-account--drive-bg', logo: <Logo appName={APPS.PROTONDRIVE} /> };
        }

        if (plan === PLANS.PASS_PLUS) {
            return { bgClassName: 'subscribe-account--pass-bg', logo: <Logo appName={APPS.PROTONPASS} /> };
        }

        if (plan === PLANS.MAIL || plan === PLANS.MAIL_PRO) {
            return { bgClassName: 'subscribe-account--mail-bg', logo: <Logo appName={APPS.PROTONMAIL} /> };
        }

        return {
            bgClassName: 'subscribe-account--mail-bg',
            logo: (
                <>
                    <ProtonLogo color="brand" className="block sm:hidden" />
                    <ProtonLogo color="invert" className="hidden sm:block" />
                </>
            ),
        };
    })();

    const step = (() => {
        if (maybeStart === 'compare') {
            return SUBSCRIPTION_STEPS.PLAN_SELECTION;
        }
        if (maybeStart === 'checkout') {
            return SUBSCRIPTION_STEPS.CHECKOUT;
        }
        if (maybeType === 'upgrade' && plan) {
            return SUBSCRIPTION_STEPS.PLAN_SELECTION;
        }
        return user.isFree ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CUSTOMIZATION;
    })();

    const disableCycleSelectorParam = searchParams.get('disableCycleSelector');
    const disablePlanSelectionParam = searchParams.get('disablePlanSelection');
    const hideClose = Boolean(searchParams.get('hideClose'));

    const handleNotify = (type: SubscribeType) => {
        if (onceCloseRef.current) {
            return;
        }
        setType(type);
        onceCloseRef.current = true;
        if (redirect) {
            replaceUrl(redirect);
            return;
        }
        broadcast({ type: MessageType.CLOSE });
    };

    const handleClose = () => {
        handleNotify(SubscribeType.Closed);
    };

    const handleSuccess = () => {
        handleNotify(SubscribeType.Subscribed);
    };

    const bf2023IsExpired = bf2023IsExpiredFlag && coupon?.toLocaleUpperCase() === COUPON_CODES.BLACK_FRIDAY_2023;
    if (bf2023IsExpired) {
        return <PromotionExpired />;
    }

    const activeSubscription = subscription?.UpcomingSubscription ?? subscription;
    const activeSubscriptionPlan = getPlan(activeSubscription);
    const activeSubscriptionSameCoupon = !!coupon && activeSubscription?.CouponCode === coupon;
    const takingSameOffer =
        !!activeSubscription &&
        !!activeSubscriptionPlan &&
        activeSubscriptionPlan.Name === plan &&
        activeSubscription.Cycle === parsedCycle &&
        activeSubscriptionSameCoupon;

    const isOfferPlusPlan = !!maybePlanName && plusPlans.some((planName) => planName === plan);
    const isOfferBundlePlan = !!maybePlanName && plan === PLANS.BUNDLE;

    const isBundleDowngrade =
        activeSubscriptionPlan?.Name === PLANS.BUNDLE && isOfferPlusPlan && activeSubscriptionSameCoupon;

    const isFamilyDowngrade =
        activeSubscriptionPlan?.Name === PLANS.FAMILY &&
        (isOfferPlusPlan || isOfferBundlePlan) &&
        activeSubscriptionSameCoupon;

    const isVisionaryDowngrade =
        activeSubscriptionPlan?.Name === PLANS.NEW_VISIONARY && !!maybePlanName && plan !== PLANS.NEW_VISIONARY;

    if (takingSameOffer || isBundleDowngrade || isFamilyDowngrade || isVisionaryDowngrade) {
        return <PromotionAlreadyApplied />;
    }

    if (isManagedExternally(subscription)) {
        return (
            <div className="h-full flex flex-column flex-justify-center flex-align-items-center bg-norm text-center">
                <div className="max-w-custom p-11" style={{ '--max-w-custom': '33.3rem' }}>
                    <InAppText subscription={subscription} />
                </div>
            </div>
        );
    }

    if (error.title && error.message) {
        return (
            <div className="h-full flex flex-column flex-justify-center flex-align-items-center bg-norm text-center">
                <h1 className="text-bold text-2xl mb-2">{error.title}</h1>
                <div>{error.message}</div>
                {error.error && <div className="mt-2 color-weak text-sm">{error.error}</div>}
            </div>
        );
    }

    return (
        <div className={clsx(bgClassName, 'h-full overflow-auto')}>
            <div className="min-h-custom flex flex-column flex-nowrap" style={{ '--min-h-custom': '100vh' }}>
                <div className="flex-item-fluid-auto">
                    <div
                        className={clsx('mb-0 sm:mb-4 pb-0 p-4 sm:pb-6 sm:p-6 m-auto max-w-custom')}
                        style={{ '--max-w-custom': '74rem' }}
                        ref={topRef}
                    >
                        {logo}
                    </div>
                    <div className="flex flex-justify-center">
                        {type === SubscribeType.Subscribed || type === SubscribeType.Closed ? (
                            <LiteBox>
                                <SubscribeAccountDone type={type} />
                            </LiteBox>
                        ) : (
                            <SubscriptionContainer
                                topRef={topRef}
                                app={app}
                                subscription={subscription}
                                plans={plans}
                                organization={organization}
                                step={step}
                                cycle={parsedCycle}
                                currency={parsedCurrency}
                                plan={plan}
                                coupon={coupon}
                                disablePlanSelection={coupon ? true : Boolean(disablePlanSelectionParam)}
                                disableCycleSelector={coupon ? true : Boolean(disableCycleSelectorParam)}
                                disableThanksStep
                                onSubscribed={handleSuccess}
                                onUnsubscribed={handleSuccess}
                                onCancel={handleClose}
                                onCheck={(data) => {
                                    // If the initial check completes, it's handled by the container itself
                                    if (data.model.initialCheckComplete || !bf2023OfferCheck) {
                                        return;
                                    }

                                    const offerUnavailableError = {
                                        title: c('bf2023: Title').t`Offer unavailable`,
                                        message: c('bf2023: info')
                                            .t`Sorry, this offer is not available with your current plan.`,
                                        error: '',
                                    };

                                    if (data.type === 'success') {
                                        if (
                                            // Ignore visionary since it doesn't require a BF coupon
                                            !data.model.planIDs[PLANS.NEW_VISIONARY] &&
                                            // Tried to apply the BF coupon, but the API responded without it.
                                            coupon?.toUpperCase() === COUPON_CODES.BLACK_FRIDAY_2023 &&
                                            data.result.Coupon?.Code !== COUPON_CODES.BLACK_FRIDAY_2023
                                        ) {
                                            setError(offerUnavailableError);
                                        }
                                        return;
                                    }

                                    if (data.type === 'error') {
                                        const message = getApiErrorMessage(data.error);

                                        let defaultError = {
                                            title: c('bf2023: Title').t`Offer unavailable`,
                                            message: message || 'Unknown error',
                                            error: '',
                                        };

                                        const { status } = getApiError(data.error);
                                        // Getting a 400 means the user's current subscription is not compatible with the new plan, so we assume it's an offer
                                        if (status === HTTP_STATUS_CODE.BAD_REQUEST) {
                                            defaultError = {
                                                ...offerUnavailableError,
                                                error: defaultError.message,
                                            };
                                        }

                                        setError(defaultError);
                                    }
                                }}
                                metrics={{
                                    source: 'lite-subscribe',
                                }}
                                render={({ onSubmit, title, content, footer, step }) => {
                                    return (
                                        <LiteBox maxWidth={step === SUBSCRIPTION_STEPS.PLAN_SELECTION ? 72 : undefined}>
                                            <div className="flex flex-nowrap flex-item-noshrink flex-align-items-start flex-justify-space-between">
                                                <div>
                                                    {title && (
                                                        <>
                                                            <h1 className={'text-bold text-4xl'}>{title}</h1>
                                                            <div className="color-weak text-break">{nameToDisplay}</div>
                                                        </>
                                                    )}
                                                </div>
                                                {!hideClose && (
                                                    <Tooltip title={c('Action').t`Close`}>
                                                        <Button
                                                            className="flex-item-noshrink"
                                                            icon
                                                            shape="ghost"
                                                            onClick={handleClose}
                                                        >
                                                            <Icon
                                                                className="modal-close-icon"
                                                                name="cross-big"
                                                                alt={c('Action').t`Close`}
                                                            />
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <form onSubmit={onSubmit}>
                                                <div>{content}</div>
                                                {footer && <div className="mt-8">{footer}</div>}
                                            </form>
                                        </LiteBox>
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>

                <div className="my-8 hidden sm:block">
                    <div className="px-4 pt-4 sm:pt-12 pb-4 m-auto max-w-custom" style={{ '--max-w-custom': '52rem' }}>
                        <footer className="text-sm">
                            <div className="mb-1">
                                <div className="flex gap-1">
                                    {[
                                        {
                                            title: MAIL_APP_NAME,
                                            logo: <MailLogo variant="glyph-only" size={20} />,
                                        },
                                        {
                                            title: CALENDAR_APP_NAME,
                                            logo: <CalendarLogo variant="glyph-only" size={20} />,
                                        },
                                        {
                                            title: DRIVE_APP_NAME,
                                            logo: <DriveLogo variant="glyph-only" size={20} />,
                                        },
                                        {
                                            title: VPN_APP_NAME,
                                            logo: <VpnLogo variant="glyph-only" size={20} />,
                                        },
                                        {
                                            title: PASS_APP_NAME,
                                            logo: <PassLogo variant="glyph-only" size={20} />,
                                        },
                                    ].map(({ title, logo }) => {
                                        return (
                                            <div key={title} className="" title={title}>
                                                {logo}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mb-6 color-invert opacity-70">
                                {
                                    // translator: full sentence 'Proton. Privacy by default.'
                                    c('Footer').t`${BRAND_NAME}. Privacy by default.`
                                }
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscribeAccount;
