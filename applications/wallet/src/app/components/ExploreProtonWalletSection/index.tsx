import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Href } from '@proton/atoms/Href';
import { AppLink, Icon, IconName, IconSize } from '@proton/components/components';
import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';
import { BRAND_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

interface ExploreProtonWalletItemProps {
    icon: IconName;
    color?: string;
    iconSize?: IconSize;
    title: string;
    content: string;
}

const ExploreProtonWalletItem = ({ iconSize, color, icon, title, content }: ExploreProtonWalletItemProps) => {
    return (
        <Card
            rounded
            className="light-gradient-card mt-4 flex flex-column flex-align-items-start flex-item-grow max-w-custom mr-6"
            style={{
                '--max-w-custom': '13rem',
                background: `linear-gradient(90deg, ${color}15 0%, var(--background-norm) 100%)`,
            }}
        >
            <div
                className={clsx('flex w-custom h-custom rounded-full mb-3')}
                style={{ '--w-custom': '2.2rem', '--h-custom': '2.2rem', background: color }}
            >
                <Icon className="m-auto" size={iconSize} name={icon} color="#FFF" />
            </div>
            <h3 className="m-0 mb-1 text-rg color-norm">{title}</h3>
            <p className="m-0 color-hint">{content}</p>
        </Card>
    );
};

export const ExploreProtonWalletSection = () => {
    return (
        <div className="mt-14">
            <h2 className="h3 text-semibold">{c('Wallet Dashboard').t`Explore ${WALLET_APP_NAME}`}</h2>

            <div className="flex flex-row">
                <Href
                    className="text-no-decoration"
                    // TODO: change this with real KB link
                    href={getKnowledgeBaseUrl('/proton-wallet-security-best-practices')}
                >
                    <ExploreProtonWalletItem
                        icon="pass-shield"
                        iconSize={18}
                        color={ACCENT_COLORS_MAP.purple.color}
                        title={c('Wallet Dashboard').t`Security & ${WALLET_APP_NAME}`}
                        content={c('Wallet Dashboard').t`How to stay safe and protect your assets.`}
                    />
                </Href>

                <Href
                    className="text-no-decoration"
                    // TODO: change this with real KB link
                    href={getKnowledgeBaseUrl('/wallets-and-accounts')}
                >
                    <ExploreProtonWalletItem
                        icon="wallet"
                        color={ACCENT_COLORS_MAP.olive.color}
                        title={c('Wallet Dashboard').t`Wallets & Accounts`}
                        content={c('Wallet Dashboard').t`Whats the different and how to use them.`}
                    />
                </Href>

                <AppLink to="/transfer" className="text-no-decoration">
                    <ExploreProtonWalletItem
                        icon="arrow-right-arrow-left"
                        color={ACCENT_COLORS_MAP.fern.color}
                        title={c('Wallet Dashboard').t`Transfer Bitcoin`}
                        content={c('Wallet Dashboard').t`How to send and receive Bitcoin with ${BRAND_NAME}.`}
                    />
                </AppLink>

                <Href
                    className="text-no-decoration"
                    // TODO: change this with real KB link
                    href={getKnowledgeBaseUrl('/proton-wallet-mobile-wallets')}
                >
                    <ExploreProtonWalletItem
                        icon="mobile"
                        color={ACCENT_COLORS_MAP.strawberry.color}
                        title={c('Wallet Dashboard').t`Mobile Apps`}
                        content={c('Wallet Dashboard').t`Start using ${WALLET_APP_NAME} on your phone.`}
                    />
                </Href>
            </div>
        </div>
    );
};
