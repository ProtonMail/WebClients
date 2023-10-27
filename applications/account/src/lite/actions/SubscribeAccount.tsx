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
import SubscriptionContainer from '@proton/components/containers/payments/subscription/SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    COUPON_CODES,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    PLAN_TYPES,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { CURRENCIES } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getUpgradedPlan, getValidCycle } from '@proton/shared/lib/helpers/subscription';
import { Currency } from '@proton/shared/lib/interfaces';
import { canPay } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import broadcast, { MessageType } from '../broadcast';
import LiteBox from '../components/LiteBox';
import LiteLoaderPage from '../components/LiteLoaderPage';
import PromotionExpired from '../components/PromotionExpired';
import SubscribeAccountDone from '../components/SubscribeAccountDone';
import { SubscribeType } from '../types/SubscribeType';

import './SubscribeAccount.scss';

interface Props {
    redirect?: string | undefined;
    fullscreen?: boolean;
    queryParams: URLSearchParams;
    app: APP_NAMES;
}

const SubscribeAccount = ({ app, redirect, queryParams }: Props) => {
    const onceCloseRef = useRef(false);
    const topRef = useRef<HTMLDivElement>(null);
    const [user] = useUser();

    const { Email, DisplayName, Name } = user;
    const nameToDisplay = Email || DisplayName || Name;

    const [type, setType] = useState<SubscribeType | undefined>(undefined);

    const [subscription, loadingSubscription] = useSubscription();
    const [plans = [], loadingPlans] = usePlans();
    const [organization, loadingOrganization] = useOrganization();

    const bf2023IsExpiredFlag = useFlag('BF2023IsExpired');

    const canEdit = canPay(user);

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return <LiteLoaderPage />;
    }

    // Error in usage (this action is not meant to be shown if it cannot be triggered, so untranslated.
    if (!canEdit) {
        return <LiteBox>Please contact the administrator of the organization to manage the subscription</LiteBox>;
    }

    const maybeStart = queryParams.get('start');
    const maybeType = queryParams.get('type');

    const cycleParam = parseInt(queryParams.get('cycle') as any, 10);
    const parsedCycle = cycleParam ? getValidCycle(cycleParam) : undefined;
    const coupon = queryParams.get('coupon') || undefined;

    const currencyParam = queryParams.get('currency')?.toUpperCase();
    const parsedCurrency =
        currencyParam && CURRENCIES.includes(currencyParam as any) ? (currencyParam as Currency) : undefined;

    const maybePlanName = queryParams.get('plan') || '';
    const plan =
        maybeType === 'upgrade'
            ? getUpgradedPlan(subscription, app)
            : (plans.find(({ Name, Type }) => Name === maybePlanName && Type === PLAN_TYPES.PLAN)?.Name as
                  | PLANS
                  | undefined);

    const dark = coupon?.toLocaleUpperCase() === COUPON_CODES.BLACK_FRIDAY_2023;

    const { bgClassName, logo } = (() => {
        if (!dark) {
            return { bgClassName: '', logo: undefined };
        }

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
        return { bgClassName: 'subscribe-account--mail-bg', logo: <ProtonLogo color="invert" /> };
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

    const disableCycleSelectorParam = queryParams.get('disableCycleSelector');
    const disablePlanSelectionParam = queryParams.get('disablePlanSelection');
    const hideClose = Boolean(queryParams.get('hideClose'));

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

    return (
        <div className={clsx(bgClassName, 'h-full overflow-auto')}>
            {logo ? (
                <div
                    className={clsx('mb-0 sm:mb-4 p-5 m-auto max-w-custom')}
                    style={{ '--max-w-custom': '74rem' }}
                    ref={topRef}
                >
                    {logo}
                </div>
            ) : (
                <div ref={topRef} />
            )}
            {type === SubscribeType.Subscribed || type === SubscribeType.Closed ? (
                <LiteBox center={!logo}>
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
                    metrics={{
                        source: 'lite-subscribe',
                    }}
                    render={({ onSubmit, title, content, footer, step }) => {
                        return (
                            <LiteBox
                                center={false}
                                maxWidth={step === SUBSCRIPTION_STEPS.PLAN_SELECTION ? 72 : undefined}
                            >
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
                                <form className="overflow-auto" onSubmit={onSubmit}>
                                    <div>{content}</div>
                                    {footer && <div className="mt-8">{footer}</div>}
                                </form>
                            </LiteBox>
                        );
                    }}
                />
            )}
            {dark && (
                <div className="my-8">
                    <div
                        className="px-2 pt-12 pb-4 m-auto max-w-custom"
                        style={{ '--max-w-custom': step === SUBSCRIPTION_STEPS.PLAN_SELECTION ? '72rem' : '52rem' }}
                    >
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
            )}
        </div>
    );
};

export default SubscribeAccount;
