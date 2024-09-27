import { useOrganization } from '@proton/components/hooks/useOrganization';
import { useUser } from '@proton/components/hooks/useUser';
import { FeatureCode, useFeature } from '@proton/features';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';

import { KeyboardShortcut } from './KeyboardShortcut';
import { SenderImages } from './SenderImages';
import { TipsAndInsights } from './TipsAndInsights';
import { UnreadFaviconCounter } from './UnreadFaviconCounter';

export const OtherMailPreferencesSection = () => {
    const isUnreadFaviconEnabled = !!useFeature(FeatureCode.UnreadFavicon).feature?.Value;
    const [organization] = useOrganization();
    const [user] = useUser();

    const isB2BAudience = getIsB2BAudienceFromPlan(organization?.PlanName);
    const canToggleTips = user.isPaid && !isB2BAudience;

    return (
        <>
            <KeyboardShortcut />
            <SenderImages />
            {isUnreadFaviconEnabled && !isElectronMail && <UnreadFaviconCounter />}
            {canToggleTips && <TipsAndInsights />}
        </>
    );
};
