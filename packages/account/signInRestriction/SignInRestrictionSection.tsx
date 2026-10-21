import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateSignInRestriction } from '@proton/shared/lib/api/settings';
import {
    LOGIN_IDENTIFIER_POLICY,
    RESTRICTED_LOGIN_IDENTIFIER_POLICY,
} from '@proton/shared/lib/interfaces/UserSettings';

import { useAddresses } from '../addresses/hooks';
import { useUser } from '../user/hooks';
import { userSettingsActions } from '../userSettings';
import { useUserSettings } from '../userSettings/hooks';
import { getIsSignInRestricted, getSignInIdentifiers } from './helpers';

const getDescriptionAndLabel = ({ username, primaryEmail }: ReturnType<typeof getSignInIdentifiers>) => {
    const usernameElement = <strong key="username">{username}</strong>;

    if (!primaryEmail) {
        return {
            // translator: full sentence is: When sign-in is restricted, only your username <eric.norbert> can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.
            description: c('Info')
                .jt`When sign-in is restricted, only your username ${usernameElement} can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.`,
            label: c('Label').t`Restrict sign-in to username`,
        };
    }

    const primaryEmailElement = <strong key="primary-email">{primaryEmail}</strong>;

    return {
        // translator: full sentence is: When sign-in is restricted, only <eric.norbert@proton.me> and your username <eric.norbert> can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.
        description: c('Info')
            .jt`When sign-in is restricted, only ${primaryEmailElement} and your username ${usernameElement} can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.`,
        label: c('Label').t`Restrict sign-in to primary email address`,
    };
};

const SignInRestrictionSection = () => {
    const [user] = useUser();
    const [addresses = []] = useAddresses();
    const [userSettings] = useUserSettings();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();

    const { description, label } = getDescriptionAndLabel(getSignInIdentifiers(user, addresses));

    const handleChange = async (restricted: boolean) => {
        try {
            const LoginIdentifierPolicy = restricted ? RESTRICTED_LOGIN_IDENTIFIER_POLICY : LOGIN_IDENTIFIER_POLICY.ALL;
            await api(updateSignInRestriction({ LoginIdentifierPolicy }));
            dispatch(userSettingsActions.update({ UserSettings: { LoginIdentifierPolicy } }));
            createNotification({ text: c('Success').t`Preference saved` });
        } catch (error) {
            handleError(error);
        }
    };

    return (
        <SettingsSectionWide>
            <SettingsParagraph>{description}</SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="sign-in-restriction-toggle" className="text-semibold">
                        <span className="mr-2">{label}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="sign-in-restriction-toggle"
                        checked={getIsSignInRestricted(userSettings.LoginIdentifierPolicy)}
                        loading={loading}
                        onChange={({ target }) => withLoading(handleChange(target.checked))}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSectionWide>
    );
};

export default SignInRestrictionSection;
