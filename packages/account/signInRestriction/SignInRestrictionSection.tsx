import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLoading from '@proton/hooks/useLoading';
import { updateSignInRestriction } from '@proton/shared/lib/api/settings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import {
    LOGIN_IDENTIFIER_POLICY,
    RESTRICTED_LOGIN_IDENTIFIER_POLICY,
} from '@proton/shared/lib/interfaces/UserSettings';

import { useAddresses } from '../addresses/hooks';
import { useDispatch } from '../store/hooks';
import { useUser } from '../user/hooks';
import { userSettingsActions } from '../userSettings';
import { useUserSettings } from '../userSettings/hooks';
import SignInRestrictionConfirmModal from './SignInRestrictionConfirmModal';
import { getIsSignInRestricted, getSignInIdentifiers } from './helpers';

const getUsernameAndAddressesDescription = (username: string, signInDomains: string[]) => {
    const [firstEmail, secondEmail, thirdEmail] = signInDomains.map((domain) => `${username}@${domain}`);

    if (thirdEmail) {
        // translator: full sentence is: When sign-in is restricted, you can only sign in with your username, <eric.norbert>, or with <eric.norbert@proton.me>, <eric.norbert@protonmail.com>, or <eric.norbert@protonmail.ch>. Your other email addresses won’t work for sign-in.
        return c('Info')
            .t`When sign-in is restricted, you can only sign in with your username, **${username}**, or with **${firstEmail}**, **${secondEmail}**, or **${thirdEmail}**. Your other email addresses won’t work for sign-in.`;
    }

    if (secondEmail) {
        // translator: full sentence is: When sign-in is restricted, you can only sign in with your username, <eric.norbert>, or with <eric.norbert@proton.me> or <eric.norbert@protonmail.com>. Your other email addresses won’t work for sign-in.
        return c('Info')
            .t`When sign-in is restricted, you can only sign in with your username, **${username}**, or with **${firstEmail}** or **${secondEmail}**. Your other email addresses won’t work for sign-in.`;
    }

    // translator: full sentence is: When sign-in is restricted, you can only sign in with your username, <eric.norbert>, or with <eric.norbert@proton.me>. Your other email addresses won’t work for sign-in.
    return c('Info')
        .t`When sign-in is restricted, you can only sign in with your username, **${username}**, or with **${firstEmail}**. Your other email addresses won’t work for sign-in.`;
};

const getDescriptionAndLabel = ({ username, primaryEmail, signInDomains }: ReturnType<typeof getSignInIdentifiers>) => {
    if (!username) {
        return {
            // translator: full sentence is: When sign-in is restricted, only your email <eric.norbert@example.com> can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.
            description: c('Info')
                .t`When sign-in is restricted, only your email **${primaryEmail}** can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.`,
            label: c('Label').t`Restrict sign-in to email address`,
        };
    }

    if (!signInDomains.length) {
        return {
            // translator: full sentence is: When sign-in is restricted, only your username <eric.norbert> can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.
            description: c('Info')
                .t`When sign-in is restricted, only your username **${username}** can be used to sign in. Your other addresses can’t be linked back to your account, even if someone knows them.`,
            label: c('Label').t`Restrict sign-in to username`,
        };
    }

    return {
        description: getUsernameAndAddressesDescription(username, signInDomains),
        label: c('Label').t`Restrict sign-in to username and matching ${BRAND_NAME} addresses`,
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
    const [confirmModalProps, setConfirmModalOpen, renderConfirmModal] = useModalState();

    const identifiers = getSignInIdentifiers(user, addresses);
    const { description, label } = getDescriptionAndLabel(identifiers);

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
            <SettingsParagraph>{getBoldFormattedText(description, 'text-break')}</SettingsParagraph>
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
                        onChange={({ target }) => {
                            if (target.checked) {
                                setConfirmModalOpen(true);
                                return;
                            }
                            void withLoading(handleChange(false));
                        }}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            {renderConfirmModal && (
                <SignInRestrictionConfirmModal
                    {...confirmModalProps}
                    identifiers={identifiers}
                    onConfirm={() => {
                        confirmModalProps.onClose();
                        void withLoading(handleChange(true));
                    }}
                />
            )}
        </SettingsSectionWide>
    );
};

export default SignInRestrictionSection;
