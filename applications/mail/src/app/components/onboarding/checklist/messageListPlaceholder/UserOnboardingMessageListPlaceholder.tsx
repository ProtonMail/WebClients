import { useActiveBreakpoint } from '@proton/components';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { isColumnMode } from 'proton-mail/helpers/mailSettings';

import UserOnboardingAccountsSwitcher from './UserOnboardingAccountsSwitcher';

interface Props {
    location: 'list' | 'emptyPlaceholder' | 'mailboxContainerPlaceholder';
}

/**
 * Displayed in mail list as a placeholder when:
 * - no messages
 * - onboarding is done
 */
const UserOnboardingMessageListPlaceholder = ({ location }: Props) => {
    const [mailSettings] = useMailSettings();
    const { viewportWidth } = useActiveBreakpoint();
    const hidden = location === 'list' && viewportWidth['>=large'] ? isColumnMode(mailSettings) : undefined;

    return hidden ? null : <UserOnboardingAccountsSwitcher />;
};

export default UserOnboardingMessageListPlaceholder;
