import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Logo } from '@proton/components';
import EarlyAccessBadge from '@proton/components/components/earlyAccessBadge/EarlyAccessBadge';
import useLoading from '@proton/hooks/useLoading';
import { PLANS, getHasPlusPlan } from '@proton/payments';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { User } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

interface App {
    name: APP_NAMES;
    description: () => string;
    bit: PRODUCT_BIT;
    isNew?: boolean;
}

export const getExploreApps = ({
    subscribed,
    ...options
}: {
    subscribed?: User['Subscribed'];
} & Omit<Parameters<typeof getAvailableApps>[0], 'context'>) => {
    const user = options.user;
    const availableApps = getAvailableApps({ ...options, context: 'dropdown' });
    return [
        {
            name: APPS.PROTONMAIL,
            bit: PRODUCT_BIT.MAIL,
            description: () => {
                return c('app-switcher').t`Secure your communications`;
            },
        },
        {
            name: APPS.PROTONCALENDAR,
            bit: PRODUCT_BIT.MAIL,
            description: () => {
                return c('app-switcher').t`Keep your schedule private`;
            },
        },
        {
            name: APPS.PROTONDRIVE,
            bit: PRODUCT_BIT.DRIVE,
            description: () => {
                return c('app-switcher').t`Safeguard your files and photos`;
            },
        },
        {
            name: APPS.PROTONVPN_SETTINGS,
            bit: PRODUCT_BIT.VPN,
            description: () => {
                return c('app-switcher').t`Browse the web privately and block ads`;
            },
        },
        {
            name: APPS.PROTONPASS,
            bit: PRODUCT_BIT.PASS,
            condition: hasPassLifetime,
            description: () => {
                return c('app-switcher').t`Protect your passwords and identity`;
            },
        },
        {
            name: APPS.PROTONWALLET,
            bit: PRODUCT_BIT.WALLET,
            description: () => {
                return c('wallet_signup_2024:app-switcher').t`A safer way to hold Bitcoin`;
            },
        },
        {
            name: APPS.PROTONLUMO,
            bit: PRODUCT_BIT.LUMO,
            description: () => {
                return c('collider_2025: app-switcher').t`Chat with a private AI assistant`;
            },
        },
    ]
        .sort((a, b) => {
            if (
                (hasBit(subscribed, a.bit) && !hasBit(subscribed, b.bit)) ||
                (user && a.condition?.(user) && !b.condition?.(user))
            ) {
                return -1;
            }
            if (
                (hasBit(subscribed, b.bit) && !hasBit(subscribed, a.bit)) ||
                (user && b.condition?.(user) && !a.condition?.(user))
            ) {
                return 1;
            }
            return 0;
        })
        .filter(({ name }) => availableApps.includes(name));
};

interface Props {
    onExplore: (app: APP_NAMES) => Promise<void>;
    apps: App[];
    subscription: {
        subscribed: number;
        plan: PLANS | undefined;
    };
}

const allBits = PRODUCT_BIT.MAIL | PRODUCT_BIT.PASS | PRODUCT_BIT.DRIVE | PRODUCT_BIT.VPN | PRODUCT_BIT.WALLET;

const professionalPlans = new Set([PLANS.MAIL_BUSINESS, PLANS.PASS_BUSINESS, PLANS.VPN_BUSINESS]);

const essentialsPlans = new Set([PLANS.MAIL_PRO, PLANS.PASS_PRO, PLANS.VPN_PRO, PLANS.DRIVE_PRO]);

const getNameFromPlan = (plan?: PLANS) => {
    if (!plan) {
        return '';
    }
    if (essentialsPlans.has(plan)) {
        return 'Essentials';
    }
    if (professionalPlans.has(plan)) {
        return 'Professional';
    }
    if (getHasPlusPlan(plan)) {
        return 'Plus';
    }
};

const ExploreAppsList = ({ onExplore, apps, subscription }: Props) => {
    const [loading, withLoading] = useLoading();
    const [type, setType] = useState<APP_NAMES | null>(null);

    let planName = getNameFromPlan(subscription.plan);
    if (hasBit(subscription.subscribed, allBits)) {
        planName = '';
    }

    return (
        <ul className="unstyled m-0 divide-y">
            {apps.map((app) => {
                const appName = app.name;
                const name = getAppName(appName);
                const description = app.description();
                const showLoader = type === appName && loading;
                const paid = hasBit(subscription.subscribed, app.bit);
                const isNew = app.isNew;
                return (
                    <li key={appName}>
                        <Button
                            loading={showLoader}
                            data-testid={appName.replace('proton-', 'explore-')}
                            size="large"
                            shape="ghost"
                            className="flex items-center text-left my-2"
                            fullWidth
                            onClick={() => {
                                if (loading) {
                                    return;
                                }
                                setType(appName);
                                void withLoading(onExplore(appName));
                            }}
                        >
                            <Logo
                                appName={appName}
                                size={15}
                                variant="glyph-only"
                                className="shrink-0 mr-2"
                                aria-hidden="true"
                            />{' '}
                            <div className="flex-1 flex flex-column">
                                <div className="text-ellipsis">
                                    {name}
                                    {isNew && (
                                        <span className="ml-2">
                                            <EarlyAccessBadge />
                                        </span>
                                    )}
                                    {paid && planName ? (
                                        <>
                                            {' '}
                                            <span
                                                className="text-bold text-xs rounded-xl px-2"
                                                style={{
                                                    backgroundColor: 'var(--background-weak)',
                                                    color: 'var(--primary)',
                                                }}
                                            >
                                                {planName}
                                            </span>
                                        </>
                                    ) : undefined}
                                </div>
                                <div className="text-sm color-weak">{description}</div>
                            </div>
                            {!showLoader && (
                                <span className="shrink-0" aria-hidden="true">
                                    <Icon name="arrow-right" />
                                </span>
                            )}
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
};
export default ExploreAppsList;
