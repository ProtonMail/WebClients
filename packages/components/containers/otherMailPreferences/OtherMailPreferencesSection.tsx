import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { SettingsCardRows } from '../account/SettingsCardRows';
import AutomaticallySaveContacts from './AutomaticallySaveContacts';
import { KeyboardShortcut } from './KeyboardShortcut';
import { SenderImages } from './SenderImages';
import { TipsAndInsights } from './TipsAndInsights';
import { UnreadFaviconCounter } from './UnreadFaviconCounter';

export const OtherMailPreferencesSection = () => {
    const [user] = useUser();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();

    const canToggleTips = !loadingEntitlements && user.isPaid && !entitlements.isB2B;

    return (
        <SettingsCardRows>
            <KeyboardShortcut />
            <SenderImages />
            {!isElectronMail && <UnreadFaviconCounter />}
            {canToggleTips && <TipsAndInsights />}
            <AutomaticallySaveContacts />
        </SettingsCardRows>
    );
};
