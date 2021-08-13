import { c } from 'ttag';
import { updateNotifyEmail, updateResetEmail, updateResetPhone } from '@proton/shared/lib/api/settings';
import { CLIENT_TYPES } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import { Button, Info, Loader, Toggle } from '../../components';

import {
    useApi,
    useConfig,
    useEventManager,
    useLoading,
    useModals,
    useMyLocation,
    useNotifications,
    useUser,
    useUserSettings,
} from '../../hooks';

import AuthModal from '../password/AuthModal';
import RecoveryEmail from './RecoveryEmail';
import RecoveryPhone from './RecoveryPhone';
import SettingsParagraph from '../account/SettingsParagraph';
import { SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { GenerateMnemonicModal, DisableMnemonicModal } from '../mnemonic';
import useIsMnemonicAvailable from '../../hooks/useIsMnemonicAvailable';

const { VPN } = CLIENT_TYPES;

const RecoveryMethodsSection = () => {
    const { createModal } = useModals();
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [loadingReset, withLoadingReset] = useLoading();
    const [loadingNotify, withLoadingNotify] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const { CLIENT_TYPE } = useConfig();
    const [myLocation, loadingMyLocation] = useMyLocation();
    const defaultCountry = myLocation?.Country?.toUpperCase();

    const isMnemonicAvailable = useIsMnemonicAvailable();

    const mnemonicEnabled =
        user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED ||
        user.MnemonicStatus === MNEMONIC_STATUS.ENABLED ||
        user.MnemonicStatus === MNEMONIC_STATUS.SET;
    const [loadingMnemonic, withLoadingMnemonic] = useLoading();

    if (loadingUserSettings || !userSettings || loadingMyLocation) {
        return <Loader />;
    }

    const handleChangePasswordEmailToggle = async (value: number) => {
        if (value && !userSettings.Email.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery/notification email first`,
            });
        }
        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateResetEmail(value)} />);
        });
        await call();
    };

    const handleChangePasswordPhoneToggle = async (value: number) => {
        if (value && !userSettings.Phone.Value) {
            return createNotification({ type: 'error', text: c('Error').t`Please set a recovery phone number first` });
        }
        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateResetPhone({ Reset: value })} />);
        });
        await call();
    };

    const handleChangeEmailNotify = async (value: number) => {
        if (value && !userSettings.Email.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery/notification email first`,
            });
        }
        await api(updateNotifyEmail(value));
        await call();
    };

    const text =
        CLIENT_TYPE !== VPN
            ? c('Info')
                  .t`We recommend adding a linked email or phone number so you can recover your account if you lose your password.`
            : c('Info')
                  .t`We recommend adding a linked email so you can recover your account if you lose your password.`;

    return (
        <SettingsSection>
            <SettingsParagraph>{text}</SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="recovery-email-input">
                        {c('Label').t`Email address`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex-item-fluid">
                    <RecoveryEmail
                        className="mb0 on-mobile-mb1"
                        email={userSettings.Email.Value}
                        hasReset={!!userSettings.Email.Reset}
                        hasNotify={!!userSettings.Email.Notify}
                    />
                    <div className="mb1 flex flex-align-items-center">
                        <Toggle
                            className="mr0-5"
                            loading={loadingReset}
                            checked={!!userSettings.Email.Reset && !!userSettings.Email.Value}
                            id="passwordEmailResetToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingReset(handleChangePasswordEmailToggle(+checked))
                            }
                        />
                        <label htmlFor="passwordEmailResetToggle" className="mr0-5 flex-item-fluid">
                            <span className="mr0-5">{c('Label').t`Allow recovery by email`}</span>
                            <Info
                                url="https://protonmail.com/blog/notification-emails/"
                                title={c('Info')
                                    .t`Disabling this will prevent this email from being used for account recovery.`}
                            />
                        </label>
                    </div>
                    {CLIENT_TYPE !== VPN ? (
                        <div className="flex flex-align-items-center">
                            <Toggle
                                className="mr0-5"
                                loading={loadingNotify}
                                checked={!!userSettings.Email.Notify && !!userSettings.Email.Value}
                                id="dailyNotificationsToggle"
                                onChange={({ target: { checked } }) =>
                                    withLoadingNotify(handleChangeEmailNotify(+checked))
                                }
                            />
                            <label htmlFor="dailyNotificationsToggle" className="mr0-5 flex-item-fluid">
                                <span className="pr0-5">{c('Label').t`Daily email notifications`}</span>
                                <Info
                                    url="https://protonmail.com/blog/notification-emails/"
                                    title={c('Info')
                                        .t`When notifications are enabled, we'll send an alert to your recovery/notification address if you have new messages in your ProtonMail account.`}
                                />
                            </label>
                        </div>
                    ) : null}
                </SettingsLayoutRight>
            </SettingsLayout>

            {CLIENT_TYPE !== VPN && (
                <>
                    <hr className="mb2 mt2" />

                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label className="pt0 on-mobile-mb0-5 text-semibold" htmlFor="phoneInput">
                                {c('label').t`Phone number`}
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="flex-item-fluid">
                            <RecoveryPhone
                                className="mb0 on-mobile-mb1"
                                defaultCountry={defaultCountry}
                                phone={userSettings.Phone.Value}
                                hasReset={!!userSettings.Phone.Reset}
                            />
                            <div className="flex flex-align-items-center">
                                <Toggle
                                    className="mr0-5"
                                    loading={loadingReset}
                                    checked={!!userSettings.Phone.Reset && !!userSettings.Phone.Value}
                                    id="passwordPhoneResetToggle"
                                    onChange={({ target: { checked } }) =>
                                        withLoadingReset(handleChangePasswordPhoneToggle(+checked))
                                    }
                                />
                                <label htmlFor="passwordPhoneResetToggle" className="mr0-5 flex-item-fluid">
                                    <span className="pr0-5">{c('Label').t`Allow recovery by phone`}</span>
                                    <Info
                                        title={c('Info')
                                            .t`Disabling this will prevent this phone number from being used for account recovery.`}
                                    />
                                </label>
                            </div>
                        </SettingsLayoutRight>
                    </SettingsLayout>

                    {isMnemonicAvailable && (
                        <>
                            <hr className="mb2 mt2" />

                            <SettingsLayout>
                                <SettingsLayoutLeft>
                                    <label
                                        className="pt0 on-mobile-mb0-5 text-semibold"
                                        htmlFor="mnemonic-phrase-toggle"
                                    >
                                        <span className="mr0-5">{c('label').t`Recovery phrase`}</span>
                                        <Info
                                            title={c('Info')
                                                .t`A recovery phrase lets you access your account and recover your encrypted messages if you forget your password.`}
                                        />
                                    </label>
                                </SettingsLayoutLeft>
                                <SettingsLayoutRight className="flex-item-fluid pt0-5">
                                    <div className="flex flex-align-items-center mb1-5">
                                        <Toggle
                                            className="mr0-5"
                                            loading={loadingMnemonic}
                                            checked={mnemonicEnabled}
                                            id="passwordMnemonicResetToggle"
                                            onChange={({ target: { checked } }) => {
                                                const handleMnemonicToggle = async (willBeChecked: boolean) => {
                                                    await new Promise<any>((resolve, reject) => {
                                                        if (willBeChecked) {
                                                            createModal(
                                                                <GenerateMnemonicModal
                                                                    onClose={reject}
                                                                    onSuccess={resolve}
                                                                />
                                                            );
                                                        } else {
                                                            createModal(
                                                                <DisableMnemonicModal
                                                                    onClose={reject}
                                                                    onSuccess={resolve}
                                                                />
                                                            );
                                                        }
                                                    });
                                                    await call();
                                                };

                                                return withLoadingMnemonic(handleMnemonicToggle(checked));
                                            }}
                                        />
                                        <label htmlFor="passwordMnemonicResetToggle" className="mr0-5 flex-item-fluid">
                                            <span className="pr0-5">{c('Label')
                                                .t`Allow recovery by recovery phrase`}</span>
                                            <Info
                                                title={c('Info')
                                                    .t`Disabling this will prevent your recovery phrase from being used for account recovery.`}
                                            />
                                        </label>
                                    </div>

                                    {mnemonicEnabled ? (
                                        <Button
                                            shape="outline"
                                            onClick={async () => {
                                                await new Promise((resolve, reject) => {
                                                    createModal(
                                                        <GenerateMnemonicModal
                                                            onClose={reject}
                                                            onSuccess={resolve}
                                                            confirmStep
                                                        />
                                                    );
                                                });
                                                await call();
                                            }}
                                        >
                                            {c('Action').t`Create new recovery phrase`}
                                        </Button>
                                    ) : null}
                                </SettingsLayoutRight>
                            </SettingsLayout>
                        </>
                    )}
                </>
            )}
        </SettingsSection>
    );
};

export default RecoveryMethodsSection;
