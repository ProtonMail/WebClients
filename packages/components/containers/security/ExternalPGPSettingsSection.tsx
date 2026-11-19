import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateAttachPublicKey, updatePGPScheme, updateSign } from '@proton/shared/lib/api/mailSettings';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { ATTACH_PUBLIC_KEY, SIGN } from '@proton/shared/lib/mail/mailSettings';

import useModalState from '../../components/modalTwo/useModalState';
import type { PromptProps } from '../../components/prompt/Prompt';
import Prompt from '../../components/prompt/Prompt';
import { SettingsCardRows } from '../account/SettingsCardRows';
import { SettingsSelectRow } from '../account/SettingsSelectRow';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
import { PGPSchemeSelect } from './PGPSchemeSelect';

interface AutomaticallySignModalProps extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onConfirm: (value: boolean) => void;
}

const AutomaticallySignModal = ({ onConfirm, ...rest }: AutomaticallySignModalProps) => {
    return (
        <Prompt
            title={c('Title').t`Automatically sign outgoing messages?`}
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        onConfirm(true);
                        rest.onClose?.();
                    }}
                    data-testid="automatically-sign-modal:confirm"
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
        </Prompt>
    );
};

export const ExternalPGPSettingsSection = () => {
    const [{ Sign, AttachPublicKey, PGPScheme }] = useMailSettings();
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();
    const [loadingSign, withLoadingSign] = useLoading();
    const [loadingAttach, withLoadingAttach] = useLoading();
    const [loadingScheme, withLoadingScheme] = useLoading();

    const [automaticallySignModalProps, setAutomaticallySignModalOpen, renderAutomaticallySign] = useModalState();

    const handleChangeSign = async (value: number) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateSign(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleAttachPublicKey = async (value: number) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateAttachPublicKey(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleChangeScheme = async (value: number) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updatePGPScheme(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    const handleAutomaticallySign = async (shouldSign: boolean) => {
        if (shouldSign) {
            await api<{ MailSettings: MailSettings }>(updateSign(SIGN.ENABLED));
        }
        const { MailSettings: MailSettings } = await api<{ MailSettings: MailSettings }>(
            updateAttachPublicKey(ATTACH_PUBLIC_KEY.ENABLED)
        );
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        createNotification({ text: c('Info').t`Encryption setting updated` });
    };

    return (
        <DashboardGrid as="div">
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
            <DashboardGridSectionHeader
                title={c('Title').t`External PGP settings`}
                subtitle={
                    <>
                        {c('Info')
                            .t`Only change these settings if you are using PGP with non-${BRAND_NAME} recipients.`}{' '}
                        <Href href={getKnowledgeBaseUrl('/how-to-use-pgp')}>{c('Link').t`Learn more`}</Href>
                    </>
                }
            />
            <DashboardCard>
                <DashboardCardContent>
                    <SettingsCardRows>
                        <SettingsToggleRow
                            id="signToggle"
                            label={
                                <>
                                    <SettingsToggleRow.Label>{c('Label')
                                        .t`Sign external messages`}</SettingsToggleRow.Label>
                                    <SettingsToggleRow.Description>
                                        {c('Tooltip sign external messages')
                                            .t`Automatically sign all your outgoing messages so users can verify the authenticity of your messages. This is done in combination with the default PGP settings which can be configured below.`}{' '}
                                        <Href href={getKnowledgeBaseUrl('/what-is-a-digital-signature')}>
                                            {c('Link').t`Learn more`}
                                        </Href>
                                    </SettingsToggleRow.Description>
                                </>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
                                    checked={!!Sign}
                                    onChange={(e) => {
                                        withLoadingSign(handleChangeSign(+e.target.checked));
                                    }}
                                    loading={loadingSign}
                                />
                            }
                        />
                        <SettingsToggleRow
                            id="attachPublicKeyToggle"
                            label={
                                <>
                                    <SettingsToggleRow.Label>{c('Label').t`Attach public key`}</SettingsToggleRow.Label>
                                    <SettingsToggleRow.Description>
                                        {c('Tooltip automatically attach public key')
                                            .t`This automatically adds your public key to each message you send. Recipients can use this to verify the authenticity of your messages and send encrypted messages to you.`}
                                    </SettingsToggleRow.Description>
                                </>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
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
                            }
                        />
                        <SettingsSelectRow
                            id="PGPSchemeSelect"
                            label={
                                <>
                                    <SettingsSelectRow.Label>{c('Label')
                                        .t`Default PGP scheme`}</SettingsSelectRow.Label>
                                    <SettingsSelectRow.Description>
                                        {c('Tooltip default pgp scheme')
                                            .t`Select the default PGP settings used to sign or encrypt messages with non-${BRAND_NAME} PGP users. Note that Inline PGP forces plain text messages.`}{' '}
                                        <Href href={getKnowledgeBaseUrl('/pgp-mime-pgp-inline')}>
                                            {c('Link').t`Learn more`}
                                        </Href>
                                    </SettingsSelectRow.Description>
                                </>
                            }
                            select={
                                <PGPSchemeSelect
                                    id="PGPSchemeSelect"
                                    pgpScheme={PGPScheme}
                                    onChange={(e) => {
                                        withLoadingScheme(handleChangeScheme(+e.target.value));
                                    }}
                                    disabled={loadingScheme}
                                />
                            }
                        />
                    </SettingsCardRows>
                </DashboardCardContent>
            </DashboardCard>
        </DashboardGrid>
    );
};
