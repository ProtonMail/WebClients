import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import AutomaticallySaveContacts from '@proton/components/containers/otherMailPreferences/AutomaticallySaveContacts';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { KeyboardShortcut } from './KeyboardShortcut';
import { SenderImages } from './SenderImages';
import { TipsAndInsights } from './TipsAndInsights';
import { UnreadFaviconCounter } from './UnreadFaviconCounter';

export const OtherMailPreferencesSection = () => {
    const [organization] = useOrganization();
    const [user] = useUser();

    const isB2BAudience = getIsB2BAudienceFromPlan(organization?.PlanName);
    const canToggleTips = user.isPaid && !isB2BAudience;

    return (
        <>
            <KeyboardShortcut />
            <SenderImages />
            {!isElectronMail && <UnreadFaviconCounter />}
            {canToggleTips && <TipsAndInsights />}
            <AutomaticallySaveContacts />
        </>
    );
};
