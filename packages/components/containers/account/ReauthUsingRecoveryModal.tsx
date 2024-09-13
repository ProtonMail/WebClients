import { useState } from 'react';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import { getMnemonicAuthInfo, reauthMnemonic } from '@proton/shared/lib/api/auth';
import { reauthByEmailVerification, reauthBySmsVerification } from '@proton/shared/lib/api/verify';
import type { InfoResponse } from '@proton/shared/lib/authentication/interface';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { srpAuth } from '@proton/shared/lib/srp';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { ModalProps } from '../../components';
import {
    Form,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    Tabs,
    useFormErrors,
} from '../../components';
import {
    useApi,
    useAuthentication,
    useIsSessionRecoveryInitiationAvailable,
    useUser,
    useUserSettings,
} from '../../hooks';
import MnemonicInputField, { useMnemonicInputValidation } from '../mnemonic/MnemonicInputField';

interface Props extends ModalProps {
    onInitiateSessionRecoveryClick?: () => void;
    onBack?: () => void;
    availableRecoveryMethods: ('mnemonic' | 'email' | 'sms')[];
    title?: string;
    onSuccess: () => void;
}

const ReauthUsingRecoveryModal = ({
    onInitiateSessionRecoveryClick,
    onBack,
    availableRecoveryMethods,
    title,
    onClose,
    onSuccess,
    ...rest
}: Props) => {
    const api = useApi();

    const [user] = useUser();
    const authentication = useAuthentication();
    const { validator, onFormSubmit } = useFormErrors();
    const [userSettings] = useUserSettings();

    const [submitting, withSubmitting] = useLoading();
    const [tabIndex, setTabIndex] = useState(0);
    const [mnemonic, setMnemonic] = useState('');
    const mnemonicValidation = useMnemonicInputValidation(mnemonic);

    const currentMethod = availableRecoveryMethods[tabIndex];

    const isSessionRecoveryInitiationAvailable = useIsSessionRecoveryInitiationAvailable();

    const onSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        if (currentMethod === 'email') {
            await api(reauthByEmailVerification());
        } else if (currentMethod === 'sms') {
            await api(reauthBySmsVerification());
        } else if (currentMethod === 'mnemonic') {
            const persistent = authentication.getPersistent();
            const username = user.Email || user.Name;
            const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);
            const info = await api<InfoResponse>(getMnemonicAuthInfo(username));
            await srpAuth({
                info,
                api,
                config: reauthMnemonic({
                    Username: username,
                    PersistentCookies: persistent,
                }),
                credentials: {
                    username: username,
                    password: randomBytes,
                },
            });
        }

        await onSuccess();
        onClose?.();
    };

    const toProceed = c('Info').t`To proceed, we must verify the request.`;
    const codeResetString = (value: string) => {
        const boldValue = (
            <b data-testid="recovery-modal-code-destination" key="bold-reset-method-value">
                {value}
            </b>
        );
        // translator: boldValue will be the recovery email address or recovery phone number in bold
        return c('Info').jt`We’ll send a reset code to ${boldValue}.`;
    };
    const phraseString = c('Info').t`Enter your recovery phrase to change your password now.`;

    return (
        <Modal onClose={onClose} as={Form} onSubmit={() => withSubmitting(onSubmit())} {...rest}>
            <ModalHeader title={title || c('Title').t`Reset password`} subline={user.Email} />
            <ModalContent>
                {availableRecoveryMethods.length > 1 && (
                    <div className="mb-2">
                        {c('Info').t`To proceed, select an account recovery method so we can verify the request.`}
                    </div>
                )}

                <Tabs
                    fullWidth
                    tabs={[
                        availableRecoveryMethods.includes('email') && {
                            title: c('Recovery method').t`Email`,
                            content: (
                                <>
                                    <div className={clsx(availableRecoveryMethods.length === 1 && 'mt-2')}>
                                        {availableRecoveryMethods.length === 1 && toProceed}{' '}
                                        {codeResetString(userSettings.Email.Value)}
                                    </div>

                                    {isSessionRecoveryInitiationAvailable && onInitiateSessionRecoveryClick && (
                                        <InlineLinkButton className="mt-2" onClick={onInitiateSessionRecoveryClick}>
                                            {c('Info').t`Can’t access your recovery email?`}
                                        </InlineLinkButton>
                                    )}
                                </>
                            ),
                        },
                        availableRecoveryMethods.includes('sms') && {
                            title: c('Recovery method').t`Phone number`,
                            content: (
                                <>
                                    <div className={clsx(availableRecoveryMethods.length === 1 && 'mt-2')}>
                                        {availableRecoveryMethods.length === 1 && toProceed}{' '}
                                        {codeResetString(userSettings.Phone.Value)}
                                    </div>

                                    {isSessionRecoveryInitiationAvailable && onInitiateSessionRecoveryClick && (
                                        <InlineLinkButton className="mt-2" onClick={onInitiateSessionRecoveryClick}>
                                            {c('Info').t`Can’t access your recovery phone?`}
                                        </InlineLinkButton>
                                    )}
                                </>
                            ),
                        },
                        availableRecoveryMethods.includes('mnemonic') && {
                            title: c('Recovery method').t`Phrase`,
                            content: (
                                <>
                                    <div className={clsx('mb-4', availableRecoveryMethods.length === 1 && 'mt-2')}>
                                        {availableRecoveryMethods.length === 1 && toProceed} {phraseString}
                                    </div>

                                    <MnemonicInputField
                                        disableChange={submitting}
                                        value={mnemonic}
                                        onValue={setMnemonic}
                                        autoFocus
                                        error={validator(
                                            currentMethod === 'mnemonic'
                                                ? [requiredValidator(mnemonic), ...mnemonicValidation]
                                                : []
                                        )}
                                    />

                                    {isSessionRecoveryInitiationAvailable && onInitiateSessionRecoveryClick && (
                                        <InlineLinkButton className="mt-2" onClick={onInitiateSessionRecoveryClick}>
                                            {c('Info').t`Don’t know your recovery phrase?`}
                                        </InlineLinkButton>
                                    )}
                                </>
                            ),
                        },
                    ].filter(isTruthy)}
                    value={tabIndex}
                    onChange={(newIndex: number) => {
                        if (submitting) {
                            return;
                        }

                        setTabIndex(newIndex);
                    }}
                />
            </ModalContent>
            <ModalFooter>
                {onBack ? (
                    <Button onClick={onBack}>{c('Action').t`Back`}</Button>
                ) : (
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                )}
                <Button type="submit" color="norm" loading={submitting}>{c('Action').t`Continue`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default ReauthUsingRecoveryModal;
