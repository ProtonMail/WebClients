import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { IcQrCode } from '@proton/icons/icons/IcQrCode';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import useModalState from '../../components/modalTwo/useModalState';
import { SettingsIconRow } from '../account/SettingsIconRow';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
import SignInWithAnotherDeviceModal from './SignInWithAnotherDeviceModal';
import { useQrCodeSignInToggle } from './useQrCodeSignInToggle';

const SignInWithAnotherDeviceSettings = () => {
    const qrCodeSignInToggle = useQrCodeSignInToggle();
    const [modalProps, setModalState, renderModalState] = useModalState();

    const allowScanningQrCode = qrCodeSignInToggle.checked;

    return (
        <>
            {renderModalState && <SignInWithAnotherDeviceModal {...modalProps} />}
            <SettingsIconRow icon={IcQrCode}>
                <SettingsToggleRow
                    id="edmToggle"
                    label={
                        <>
                            {/* Cmd/Ctrl+click shortcut to open the modal; the label otherwise stays
                             * associated with the toggle */}
                            <SettingsToggleRow.Label
                                onClick={(e) => {
                                    if (allowScanningQrCode && (e.metaKey || e.ctrlKey)) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setModalState(true);
                                    }
                                }}
                            >
                                {c('edm').t`Sign in with QR code`}
                            </SettingsToggleRow.Label>
                            <SettingsToggleRow.Description>
                                {c('edm').t`Scan QR code on your mobile device to sign in.`}{' '}
                                <Href key="learn" href={getKnowledgeBaseUrl('/qr-code-sign-in')}>{c('Link')
                                    .t`Learn more`}</Href>
                            </SettingsToggleRow.Description>
                        </>
                    }
                    toggle={<SettingsToggleRow.Toggle {...qrCodeSignInToggle} />}
                />
            </SettingsIconRow>
        </>
    );
};

export default SignInWithAnotherDeviceSettings;
