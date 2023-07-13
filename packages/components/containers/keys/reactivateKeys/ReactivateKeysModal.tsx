import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { MnemonicKeyResponse, getMnemonicUserKeys } from '@proton/shared/lib/api/settingsMnemonic';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { DecryptedKey, KeySalt, MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { KeyReactivationRecord, OnKeyReactivationCallback } from '@proton/shared/lib/keys';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { computeKeyPassword } from '@proton/srp';
import isTruthy from '@proton/utils/isTruthy';

import {
    Form,
    InputFieldTwo,
    Loader,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PasswordInputTwo,
    Tabs,
    useFormErrors,
} from '../../../components';
import {
    useApi,
    useIsMnemonicAvailable,
    useModals,
    useNotifications,
    useRecoverySecrets,
    useUser,
} from '../../../hooks';
import MnemonicInputField, { useMnemonicInputValidation } from '../../mnemonic/MnemonicInputField';
import { AuthModal } from '../../password';
import RecoveryFileTabContent from './RecoveryFileTabContent';
import { KeyReactivationRequest, KeyReactivationRequestState, KeyReactivationRequestStateData } from './interface';
import { getReactivatedKeys } from './reactivateHelper';
import { getInitialStates } from './state';

interface ReactivatedKeysState {
    numberOfSuccessfullyReactivatedKeys: number;
    numberOfFailedReactivatedKeys: number;
}

interface Props extends ModalProps {
    userKeys: DecryptedKey[];
    keyReactivationRequests: KeyReactivationRequest[];
    onProcess: (keysToReactivate: KeyReactivationRecord[], onReactivation: OnKeyReactivationCallback) => Promise<void>;
}

type TabId = 'phrase' | 'password' | 'file';

const ReactivateKeysModal = ({ userKeys, keyReactivationRequests, onProcess, ...rest }: Props) => {
    const api = useApi();
    const [user] = useUser();

    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const [loading, withLoading] = useLoading(true);
    const [isSubmitting, withIsSubmitting] = useLoading(false);
    const [states, setStates] = useState<KeyReactivationRequestState[]>([]);

    const [mnemonic, setMnemonic] = useState('');
    const mnemonicValidation = useMnemonicInputValidation(mnemonic);

    const [password, setPassword] = useState('');
    const [uploadedFileKeys, setUploadedFileKeys] = useState<PrivateKeyReference[]>([]);

    const recoverySecrets = useRecoverySecrets();
    const recoveryFileAvailable = !!recoverySecrets.length;

    const fileDescription = recoveryFileAvailable
        ? c('Info').t`This is a recovery file or encryption key you may have previously saved.`
        : c('Info').t`This is an encryption key you may have previously saved.`;

    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const showMnemonicTab =
        isMnemonicAvailable &&
        (user.MnemonicStatus === MNEMONIC_STATUS.SET || user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED);

    const tabs: TabId[] = ([showMnemonicTab ? 'phrase' : undefined, 'password', 'file'] as const).filter(isTruthy);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        const run = async () => {
            const initialStates = await getInitialStates(keyReactivationRequests);
            setStates(initialStates);
        };
        void withLoading(run());
    }, []);

    const proxiedOnProcess = async (
        keysToReactivate: KeyReactivationRecord[],
        onReactivation?: OnKeyReactivationCallback
    ): Promise<ReactivatedKeysState> => {
        let numberOfSuccessfullyReactivatedKeys = 0;
        let numberOfFailedReactivatedKeys = 0;

        const proxiedOnReactivation: typeof onReactivation = (...args) => {
            onReactivation?.(...args);

            const [, result] = args;
            if (result === 'ok') {
                numberOfSuccessfullyReactivatedKeys++;
            } else {
                numberOfFailedReactivatedKeys++;
            }
        };
        await onProcess(keysToReactivate, proxiedOnReactivation);

        return { numberOfSuccessfullyReactivatedKeys, numberOfFailedReactivatedKeys };
    };

    const createKeyReactivationNotification = ({
        numberOfFailedReactivatedKeys,
        numberOfSuccessfullyReactivatedKeys,
    }: ReactivatedKeysState) => {
        if (!numberOfFailedReactivatedKeys && numberOfSuccessfullyReactivatedKeys) {
            createNotification({ type: 'success', text: c('Info').t`All keys successfully reactivated` });
            return;
        }

        if (numberOfFailedReactivatedKeys && numberOfSuccessfullyReactivatedKeys) {
            createNotification({ type: 'success', text: c('Info').t`Some keys successfully reactivated` });
            return;
        }

        createNotification({ type: 'error', text: c('Error').t`Zero keys reactivated` });
    };

    const handleRecoveryPhraseUserKeysReactivation = async (
        userKeys: { ID: string; privateKey: PrivateKeyReference }[]
    ) => {
        const records = states
            .filter((state) => !!state.user)
            .map((keyReactivationRecordState) => {
                const keysToReactivate = keyReactivationRecordState.keysToReactivate
                    .map(({ id, Key }) => {
                        const decryptedUserKey = userKeys.find(({ ID }) => ID === Key.ID);
                        if (!decryptedUserKey) {
                            return;
                        }
                        return {
                            id,
                            Key,
                            privateKey: decryptedUserKey.privateKey,
                        };
                    })
                    .filter(isTruthy);
                if (!keysToReactivate.length) {
                    return;
                }
                return {
                    ...keyReactivationRecordState,
                    keysToReactivate,
                };
            })
            .filter(isTruthy);

        const reactivatedKeysState = await proxiedOnProcess(records);
        createKeyReactivationNotification(reactivatedKeysState);
    };

    const onRecoveryPhraseSubmit = async () => {
        await new Promise((resolve, reject) => {
            createModal(<AuthModal onCancel={reject} onSuccess={resolve} config={unlockPasswordChanges()} />);
        });
        const { MnemonicUserKeys } = await api<{ MnemonicUserKeys: MnemonicKeyResponse[] }>(getMnemonicUserKeys());

        const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);
        const decryptedMnemonicUserKeys = (
            await Promise.all(
                MnemonicUserKeys.map(async ({ ID, PrivateKey, Salt }) => {
                    try {
                        const hashedPassphrase = await computeKeyPassword(randomBytes, Salt);
                        const decryptedPrivateKey = await CryptoProxy.importPrivateKey({
                            armoredKey: PrivateKey,
                            passphrase: hashedPassphrase,
                        });
                        return {
                            ID,
                            privateKey: decryptedPrivateKey,
                        };
                    } catch (e: any) {
                        return undefined;
                    }
                })
            )
        ).filter(isTruthy);

        const newlyDecryptedMnemonicUserKeys = decryptedMnemonicUserKeys.filter(({ ID }) => {
            return userKeys.find((userKey) => userKey.ID !== ID);
        });

        if (newlyDecryptedMnemonicUserKeys.length) {
            await handleRecoveryPhraseUserKeysReactivation(newlyDecryptedMnemonicUserKeys);
            await api(lockSensitiveSettings());
            return;
        }

        await api(lockSensitiveSettings());

        if (!newlyDecryptedMnemonicUserKeys.length && decryptedMnemonicUserKeys.length) {
            createNotification({
                type: 'info',
                text: c('Info').t`Recovery phrase is not associated with any outdated keys.`,
            });
            return;
        }

        createNotification({
            type: 'info',
            text: c('Info').t`Recovery phrase is not associated with any keys.`,
        });
    };

    const onPasswordSubmit = async () => {
        const keySalts = await api<{ KeySalts: KeySalt[] }>(getKeySalts())
            .then(({ KeySalts }) => KeySalts)
            .catch(() => []);

        let numberOfErrors = 0;
        const records = (
            await Promise.all(
                states.map(async (keyReactivationRecordState) => {
                    const { process, errors } = await getReactivatedKeys(
                        keyReactivationRecordState.keysToReactivate,
                        password,
                        keySalts
                    );
                    numberOfErrors += errors.length;
                    if (!process.length) {
                        return;
                    }
                    return {
                        ...keyReactivationRecordState,
                        keysToReactivate: process,
                    };
                })
            )
        ).filter(isTruthy);

        const { numberOfSuccessfullyReactivatedKeys, numberOfFailedReactivatedKeys } = await proxiedOnProcess(records);
        createKeyReactivationNotification({
            numberOfSuccessfullyReactivatedKeys,
            numberOfFailedReactivatedKeys: numberOfFailedReactivatedKeys + numberOfErrors,
        });
    };

    const onFileSubmit = async () => {
        const mapToUploadedPrivateKey = ({ id, Key, fingerprint }: KeyReactivationRequestStateData) => {
            const uploadedPrivateKey = uploadedFileKeys.find((decryptedBackupKey) => {
                return fingerprint === decryptedBackupKey.getFingerprint();
            });
            if (!uploadedPrivateKey) {
                return;
            }
            return {
                id,
                Key,
                privateKey: uploadedPrivateKey,
            };
        };

        const records = states
            .map((keyReactivationRecordState) => {
                const uploadedKeysToReactivate = keyReactivationRecordState.keysToReactivate
                    .map(mapToUploadedPrivateKey)
                    .filter(isTruthy);

                if (!uploadedKeysToReactivate.length) {
                    return;
                }

                return {
                    ...keyReactivationRecordState,
                    keysToReactivate: uploadedKeysToReactivate,
                };
            })
            .filter(isTruthy);

        const reactivatedKeysState = await proxiedOnProcess(records);
        createKeyReactivationNotification(reactivatedKeysState);
    };

    const onSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        const submit = async () => {
            if (tab === tabs.indexOf('phrase')) {
                await onRecoveryPhraseSubmit();
            } else if (tab === tabs.indexOf('password')) {
                await onPasswordSubmit();
            } else if (tab === tabs.indexOf('file')) {
                await onFileSubmit();
            }
        };

        await withIsSubmitting(submit());
        rest.onClose?.();
    };

    return (
        <ModalTwo as={Form} onSubmit={onSubmit} size="medium" {...rest}>
            <ModalTwoHeader title={c('Title').t`Recover data`} />
            <ModalTwoContent>
                <p className="mt-0">{c('Info')
                    .t`To decrypt and view your locked data after a password reset, select a recovery method.`}</p>
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <Tabs
                            value={tab}
                            tabs={[
                                showMnemonicTab
                                    ? {
                                          // translator: 'Phrase' here refers to the 'Recovery phrase'
                                          title: c('Label').t`Phrase`,
                                          content: (
                                              <>
                                                  <div className="mb-4">{c('Info')
                                                      .t`This is a 12-word phrase that you were prompted to set.`}</div>
                                                  <MnemonicInputField
                                                      disableChange={isSubmitting}
                                                      value={mnemonic}
                                                      onValue={setMnemonic}
                                                      autoFocus
                                                      error={validator(
                                                          tab === tabs.indexOf('phrase')
                                                              ? [requiredValidator(mnemonic), ...mnemonicValidation]
                                                              : []
                                                      )}
                                                  />
                                              </>
                                          ),
                                      }
                                    : undefined,
                                {
                                    title: c('Label').t`Password`,
                                    content: (
                                        <>
                                            <div className="mb-4">{c('Info')
                                                .t`This is the password you used before the password reset.`}</div>
                                            <InputFieldTwo
                                                id="password"
                                                label={c('Label').t`Previous password`}
                                                as={PasswordInputTwo}
                                                error={validator(
                                                    tab === tabs.indexOf('password')
                                                        ? [requiredValidator(password)]
                                                        : []
                                                )}
                                                value={password}
                                                onValue={setPassword}
                                                autoFocus
                                                disabled={isSubmitting}
                                            />
                                        </>
                                    ),
                                },
                                {
                                    title: c('Label').t`File`,
                                    content: (
                                        <>
                                            <div className="mb-4">{fileDescription}</div>
                                            <RecoveryFileTabContent
                                                recoverySecrets={recoverySecrets}
                                                uploadedKeys={uploadedFileKeys}
                                                setUploadedKeys={setUploadedFileKeys}
                                                disabled={isSubmitting}
                                                error={validator(
                                                    tab === tabs.indexOf('file')
                                                        ? [
                                                              requiredValidator(
                                                                  uploadedFileKeys
                                                                      .map((key) => key.getFingerprint())
                                                                      .join()
                                                              ),
                                                          ]
                                                        : []
                                                )}
                                            />
                                        </>
                                    ),
                                },
                            ].filter(isTruthy)}
                            onChange={setTab}
                        />
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} disabled={isSubmitting}>{c('Action').t`Cancel`}</Button>
                <Button type="submit" color="norm" loading={isSubmitting} disabled={loading}>{c('Action')
                    .t`Recover data`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ReactivateKeysModal;
