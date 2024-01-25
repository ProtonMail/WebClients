import { ReactNode } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Href } from '@proton/atoms/Href';
import { AppLink, Icon, IconName, IconSize } from '@proton/components/components';
import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';
import { BRAND_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

interface ExploreProtonWalletItemProps {
    children?: ReactNode;
    icon: IconName;
    color?: string;
    iconSize?: IconSize;
    content: string;
}

const ExploreProtonWalletItem = ({ children, iconSize, color, icon, content }: ExploreProtonWalletItemProps) => {
    return (
        <Card
            rounded
            background={false}
            className="relative flex flex-column"
            style={{
                backgroundImage: `linear-gradient(to right, ${color}15 0%, ${color}00 100%)`,
            }}
        >
            <div
                className={clsx('flex w-custom h-custom rounded-full mb-3')}
                style={{ '--w-custom': '2.2rem', '--h-custom': '2.2rem', backgroundColor: color }}
            >
                <Icon className="m-auto" size={iconSize} name={icon} color="#FFF" />
            </div>
            <div>
                <h3 className="m-0 my-1 text-sm color-norm">{children}</h3>
                <p className="m-0 text-sm color-hint">{content}</p>
            </div>
        </Card>
    );
};

export const ExploreProtonWalletSection = () => {
    return (
        <div className="mt-14">
            <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Explore ${WALLET_APP_NAME}`}</h2>

            <div className="grid-auto-fill mt-4 gap-4" style={{ '--min-grid-template-column-size': '16rem' }}>
                <ExploreProtonWalletItem
                    icon="pass-shield"
                    iconSize={18}
                    color={ACCENT_COLORS_MAP.purple.color}
                    content={c('Wallet Dashboard').t`How to stay safe and protect your assets.`}
                >
                    <Href
                        className="color-norm text-no-decoration expand-click-area"
                        // TODO: change this with real KB link
                        href={getKnowledgeBaseUrl('/proton-wallet-security-best-practices')}
                    >
                        {c('Wallet Dashboard').t`Security & ${WALLET_APP_NAME}`}
                    </Href>
                </ExploreProtonWalletItem>

                <ExploreProtonWalletItem
                    icon="wallet"
                    color={ACCENT_COLORS_MAP.olive.color}
                    content={c('Wallet Dashboard').t`Whats the different and how to use them.`}
                >
                    <Href
                        className="color-norm text-no-decoration expand-click-area"
                        // TODO: change this with real KB link
                        href={getKnowledgeBaseUrl('/wallets-and-accounts')}
                    >
                        {c('Wallet Dashboard').t`Wallets & Accounts`}
                    </Href>
                </ExploreProtonWalletItem>

                <ExploreProtonWalletItem
                    icon="arrow-right-arrow-left"
                    color={ACCENT_COLORS_MAP.fern.color}
                    content={c('Wallet Dashboard').t`How to send and receive Bitcoin with ${BRAND_NAME}.`}
                >
                    <AppLink to="/transfer" className="color-norm text-no-decoration expand-click-area">
                        {c('Wallet Dashboard').t`Transfer Bitcoin`}
                    </AppLink>
                </ExploreProtonWalletItem>

                <ExploreProtonWalletItem
                    icon="mobile"
                    color={ACCENT_COLORS_MAP.strawberry.color}
                    content={c('Wallet Dashboard').t`Start using ${WALLET_APP_NAME} on your phone.`}
                >
                    <Href
                        className="color-norm text-no-decoration expand-click-area"
                        // TODO: change this with real KB link
                        href={getKnowledgeBaseUrl('/proton-wallet-mobile-wallets')}
                    >
                        {c('Wallet Dashboard').t`Mobile Apps`}
                    </Href>
                </ExploreProtonWalletItem>
            </div>
        </div>
    );
};
