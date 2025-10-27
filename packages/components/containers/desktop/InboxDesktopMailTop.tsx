import { useUser } from '@proton/account/user/hooks';

import InboxDesktopOutdatedAppTopBanner from './InboxDesktopOutdatedAppTopBanner';
import { useInboxDesktopAppCache } from './appCache/useInboxDesktopAppCache';
import InboxDesktopDefaultAppTopBanner from './defaultApp/InboxDesktopDefaultAppTopBanner';
import InboxDesktopFreeTrialTopBanner from './freeTrial/InboxDesktopFreeTrialTopBanner';

interface Props {
    hasComposerInFocus: boolean;
}

export default function InboxDesktopMailTop({ hasComposerInFocus }: Props) {
    useInboxDesktopAppCache();

    const [user] = useUser();

    const className = hasComposerInFocus ? 'ignore-drag' : '';

    return (
        <>
            <InboxDesktopOutdatedAppTopBanner className={className} />
            <InboxDesktopDefaultAppTopBanner className={className} />
            {!user.hasPaidMail && <InboxDesktopFreeTrialTopBanner className={className} />}
        </>
    );
}
