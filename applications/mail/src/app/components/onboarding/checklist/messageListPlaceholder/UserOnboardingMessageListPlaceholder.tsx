import { useActiveBreakpoint } from '@proton/components';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';

import { isColumnMode } from 'proton-mail/helpers/mailSettings';

import useMailOnboardingVariant from '../../useMailOnboardingVariant';
import UsersOnboardingChecklistPlaceholder from './variants/new/UsersOnboardingReplaceAccountPlaceholder';
import OldOnboardingChecklistPlaceholder from './variants/old/OldOnboardingChecklistPlaceholder';

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
    const { variant } = useMailOnboardingVariant();
    const { viewportWidth } = useActiveBreakpoint();
    const hidden = location === 'list' && viewportWidth['>=large'] ? isColumnMode(mailSettings) : undefined;

    if (variant === 'old') {
        return <OldOnboardingChecklistPlaceholder displayOnMobile={hidden} />;
    }

    if (variant === 'new') {
        return hidden ? null : <UsersOnboardingChecklistPlaceholder />;
    }

    return null;
};

export default UserOnboardingMessageListPlaceholder;
