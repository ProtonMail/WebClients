import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Logo } from '@proton/components/components';
import useLoading from '@proton/hooks/useLoading';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES, PLANS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { User } from '@proton/shared/lib/interfaces';

interface App {
    name: APP_NAMES;
    description: () => string;
    bit: PRODUCT_BIT;
}

export const getExploreApps = ({ subscribed, user }: { subscribed?: User['Subscribed']; user: User | undefined }) => {
    const availableApps = getAvailableApps(user);
    return [
        {
            name: APPS.PROTONMAIL,
            bit: PRODUCT_BIT.Mail,
            description: () => {
                return c('app-switcher').t`Secure your communications`;
            },
        },
        {
            name: APPS.PROTONCALENDAR,
            bit: PRODUCT_BIT.Mail,
            description: () => {
                return c('app-switcher').t`Keep your schedule private`;
            },
        },
        {
            name: APPS.PROTONDRIVE,
            bit: PRODUCT_BIT.Drive,
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
            description: () => {
                return c('app-switcher').t`Protect your passwords and identity`;
            },
        },
    ]
        .sort((a, b) => {
            if (hasBit(subscribed, a.bit) && !hasBit(subscribed, b.bit)) {
                return -1;
            }
            if (hasBit(subscribed, b.bit) && !hasBit(subscribed, a.bit)) {
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

const allBits = PRODUCT_BIT.Mail | PRODUCT_BIT.PASS | PRODUCT_BIT.Drive | PRODUCT_BIT.VPN;

const getNameFromPlan = (plan?: PLANS) => {
    if (!plan) {
        return '';
    }
    if ([PLANS.MAIL_PRO, PLANS.PASS_PRO, PLANS.VPN_PRO, PLANS.DRIVE_PRO].includes(plan)) {
        return 'Essentials';
    }
    if ([PLANS.PASS_BUSINESS, PLANS.VPN_BUSINESS].includes(plan)) {
        return 'Business';
    }
    if ([PLANS.MAIL, PLANS.VPN, PLANS.PASS_PLUS, PLANS.DRIVE, PLANS.VPN_PASS_BUNDLE].includes(plan)) {
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
