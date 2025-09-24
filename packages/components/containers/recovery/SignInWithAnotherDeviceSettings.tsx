import { c } from 'ttag';

import { userSettingsActions } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import SignInWithAnotherDeviceModal from './SignInWithAnotherDeviceModal';

const SignInWithAnotherDeviceSettings = () => {
    const [userSettings] = useUserSettings();
    const [loadingEDM, withLoadingEDM] = useLoading();
    const dispatch = useDispatch();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [modalProps, setModalState, renderModalState] = useModalState();

    const handleEDMToggle = async (value: 0 | 1) => {
        await api<{ UserSettings: UserSettings }>(updateFlags({ EdmOptOut: value }));
        dispatch(userSettingsActions.update({ UserSettings: { Flags: { EdmOptOut: value } } }));
        createNotification({
            type: 'info',
            text: value ? c('edm').t`QR code sign-in disabled` : c('edm').t`QR code sign-in enabled`,
        });
    };

    const allowScanningQrCode = !userSettings?.Flags.EdmOptOut;

    return (
        <>
            {renderModalState && <SignInWithAnotherDeviceModal {...modalProps} />}
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label
                        className="text-semibold"
                        htmlFor="edmToggle"
                        onClick={(e) => {
                            if (allowScanningQrCode && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                e.stopPropagation();
                                setModalState(true);
                            }
                        }}
                    >
                        <span className="mr-2">{c('edm').t`Sign in with QR code`}</span>
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <div className="flex items-center gap-2">
                        <Toggle
                            loading={loadingEDM}
                            checked={allowScanningQrCode}
                            id="edmToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingEDM(handleEDMToggle(!checked ? 1 : 0).catch(noop))
                            }
                        />
                        <label htmlFor="edmToggle" className="flex-1">
                            {c('edm').t`Allow QR code sign‒in`}
                            <Info
                                url={getKnowledgeBaseUrl('/')}
                                title={c('edm').t`Scan QR code on your mobile device to sign in`}
                                className="ml-1"
                            />
                        </label>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default SignInWithAnotherDeviceSettings;
