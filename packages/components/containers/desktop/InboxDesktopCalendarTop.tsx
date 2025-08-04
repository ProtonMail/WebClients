import { useUser } from '@proton/account/user/hooks';

import InboxDesktopOutdatedAppTopBanner from './InboxDesktopOutdatedAppTopBanner';
import InboxDesktopFreeTrialTopBanner from './freeTrial/InboxDesktopFreeTrialTopBanner';

export default function InboxDesktopCalendarTop() {
    const [user] = useUser();

    return (
        <>
            <InboxDesktopOutdatedAppTopBanner />
            {!user.hasPaidMail && <InboxDesktopFreeTrialTopBanner />}
        </>
    );
}
