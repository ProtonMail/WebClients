import { c } from 'ttag';

import { PACKAGE_TYPE } from '@proton/shared/lib/constants';
import { updateAttachPublicKey, updatePGPScheme, updateSign } from '@proton/shared/lib/api/mailSettings';

import { Info, Toggle, AlertModal, Button, useModalState, AlertModalProps } from '../../components';
import { useMailSettings, useEventManager, useApi, useLoading, useNotifications } from '../../hooks';

import { SettingsSection, SettingsParagraph } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

import PGPSchemeSelect from './PGPSchemeSelect';

interface AutomaticallySignModalProps extends Omit<AlertModalProps, 'title' | 'buttons' | 'children'> {
    onConfirm: (value: boolean) => void;
}

const AutomaticallySignModal = ({ onConfirm, ...rest }: AutomaticallySignModalProps) => {
    return (
        <AlertModal
            title={c('Title').t`Automatically sign outgoing messages?`}
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        onConfirm(true);
                        rest.onClose?.();
                    }}
                >{c('Action').t`Yes`}</Button>,
                <Button
                    onClick={() => {
                        onConfirm(false);
                        rest.onClose?.();
                    }}
                >{c('Action').t`No`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`PGP clients are more likely to automatically detect your PGP keys if outgoing messages are signed.`}
        </AlertModal>
    );
};

const ExternalPGPSettingsSection = () => {
    const [{ Sign = 0, AttachPublicKey = 0, PGPScheme = PACKAGE_TYPE.SEND_PGP_MIME } = {}] = useMailSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loadingSign, withLoadingSign] = useLoading();
    const [loadingAttach, withLoadingAttach] = useLoading();
    const [loadingScheme, withLoadingScheme] = useLoading();

    const [automaticallySignModalProps, setAutomaticallySignModalOpen, renderAutomaticallySign] = useModalState();

    const handleChangeSign = async (value: number) => {
        await api(updateSign(value));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleAttachPublicKey = async (value: number) => {
        await api(updateAttachPublicKey(value));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleChangeScheme = async (value: number) => {
        await api(updatePGPScheme(value));
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleAutomaticallySign = async (shouldSign: boolean) => {
        await Promise.all([shouldSign ? api(updateSign(1)) : undefined, api(updateAttachPublicKey(1))]);
        await call();
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    return (
        <SettingsSection>
            {renderAutomaticallySign && (
                <AutomaticallySignModal
                    onConfirm={(shouldSign) => {
                        const promise = handleAutomaticallySign(shouldSign);
                        if (shouldSign) {
                            withLoadingSign(promise);
                        }
                        withLoadingAttach(promise);
                    }}
                    {...automaticallySignModalProps}
                />
            )}
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/how-to-use-pgp/">
                {c('Info').t`Only change these settings if you are using PGP with non-ProtonMail recipients.`}
            </SettingsParagraph>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="signToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Sign external messages`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/what-is-a-digital-signature/"
                            title={c('Tooltip sign external messages')
                                .t`Automatically sign all your outgoing messages so users can verify the authenticity of your messages. This is done in combination with the default PGP settings which can be configured below.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle
                        id="signToggle"
                        checked={!!Sign}
                        onChange={(e) => {
                            withLoadingSign(handleChangeSign(+e.target.checked));
                        }}
                        loading={loadingSign}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="attachPublicKeyToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Attach public key`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/how-to-use-pgp"
                            title={c('Tooltip automatically attach public key')
                                .t`This automatically adds your public key to each message you send. Recipients can use this to verify the authenticity of your messages and send encrypted messages to you.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <Toggle
                        id="attachPublicKeyToggle"
                        checked={!!AttachPublicKey}
                        onChange={(e) => {
                            const newValue = +e.target.checked;
                            if (newValue && !Sign) {
                                setAutomaticallySignModalOpen(true);
                            } else {
                                withLoadingAttach(handleAttachPublicKey(newValue));
                            }
                        }}
                        loading={loadingAttach}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="PGPSchemeSelect" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Default PGP scheme`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/pgp-mime-pgp-inline/"
                            title={c('Tooltip default pgp scheme')
                                .t`Select the default PGP settings used to sign or encrypt messages with non-ProtonMail PGP users. Note that Inline PGP forces plain text messages. Learn more`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <PGPSchemeSelect
                        id="PGPSchemeSelect"
                        pgpScheme={PGPScheme}
                        onChange={(e) => {
                            withLoadingScheme(handleChangeScheme(+e.target.value));
                        }}
                        disabled={loadingScheme}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default ExternalPGPSettingsSection;
