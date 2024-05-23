import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { PassFeature } from '@proton/pass/types/api/features';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

type Props = {
    itemEmail: string;
    itemUsername: string;
};

/** Handle username & email display taking into account users coming from ContentFormatVersion < 5:
 * itemEmail may be an invalid email and should be displayed as username, unless itemUsername already exists */
export const useDisplayEmailUsernameFields = ({ itemEmail, itemUsername }: Props) => {
    const usernameSplitEnabled = useFeatureFlag(PassFeature.PassUsernameSplit);
    if (!usernameSplitEnabled) {
        return { emailDisplay: itemEmail, usernameDisplay: '' };
    }

    // TODO: use Rust's email validation
    const emailDisplay = validateEmailAddress(itemEmail) || itemUsername ? itemEmail : '';
    const usernameDisplay = (() => {
        if (itemUsername) {
            return itemUsername;
        } else if (itemEmail && !emailDisplay) {
            // itemEmail is not a valid email, so display itemEmail as username
            return itemEmail;
        } else {
            return '';
        }
    })();

    return { emailDisplay, usernameDisplay };
};
