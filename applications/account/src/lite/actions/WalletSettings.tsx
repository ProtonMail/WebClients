import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import {
    CredentialLeakSection,
    LogsSection,
    PrivacySection,
    SentinelSection,
    SessionsSection,
    SubscriptionModalProvider,
} from '@proton/components';
import { APPS, DARK_WEB_MONITORING_NAME, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';

import MobileSection from '../components/MobileSection';
import MobileSectionLabel from '../components/MobileSectionLabel';
import MobileSectionRow from '../components/MobileSectionRow';

const app = APPS.PROTONWALLET;

const WalletSettings = ({
    loader,
    layout,
}: {
    loader: ReactNode;
    layout: (children: ReactNode, props?: any) => ReactNode;
}) => {
    const [user] = useUserSettings();
    const [userSettings] = useUserSettings();
    const loading = !user || !userSettings;
    const [addresses = []] = useAddresses();
    const [firstAddress] = addresses;
    const { Email = '', DisplayName = '' } = firstAddress || {};
    if (loading) {
        return loader;
    }
    return layout(
        <div className="mobile-settings">
            <SubscriptionModalProvider app={app}>
                <MobileSection title={c('Title').t`Profile`}>
                    <MobileSectionRow stackContent>
                        <MobileSectionLabel small htmlFor="email">
                            {c('Label').t`Email address`}
                        </MobileSectionLabel>
                        <div className="text-lg mt-0.5">{Email}</div>
                    </MobileSectionRow>
                    <MobileSectionRow stackContent>
                        <MobileSectionLabel small htmlFor="displayName">
                            {c('Label').t`Display name`}
                        </MobileSectionLabel>
                        <div className="text-lg mt-0.5">{DisplayName}</div>
                    </MobileSectionRow>
                </MobileSection>
                <MobileSection title={PROTON_SENTINEL_NAME}>
                    <SentinelSection app={app} />
                </MobileSection>
                <MobileSection title={DARK_WEB_MONITORING_NAME}>
                    <CredentialLeakSection />
                </MobileSection>
                <MobileSection title={c('Title').t`Session management`}>
                    <SessionsSection />
                </MobileSection>
                <MobileSection title={c('Title').t`Security logs`}>
                    <LogsSection />
                </MobileSection>
                <MobileSection title={c('Title').t`Privacy and data collection`}>
                    <PrivacySection />
                </MobileSection>
            </SubscriptionModalProvider>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default WalletSettings;
