import { useUser } from '@proton/account/user/hooks';

import InboxDesktopOutdatedAppTopBanner from './InboxDesktopOutdatedAppTopBanner';
import { useInboxDesktopAppCache } from './appCache/useInboxDesktopAppCache';
import InboxDesktopDefaultAppTopBanner from './defaultApp/InboxDesktopDefaultAppTopBanner';
import InboxDesktopFreeTrialTopBanner from './freeTrial/InboxDesktopFreeTrialTopBanner';

export default function InboxDesktopMailTop() {
    useInboxDesktopAppCache();

    const [user] = useUser();

    return (
        <>
            <InboxDesktopOutdatedAppTopBanner />
            <InboxDesktopDefaultAppTopBanner />
            {!user.hasPaidMail && <InboxDesktopFreeTrialTopBanner />}
        </>
    );
}
