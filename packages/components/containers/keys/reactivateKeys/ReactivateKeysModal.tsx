import { useEffect, useRef, useState } from 'react';
import { c, msgid } from 'ttag';
import { KeyReactivationRecord, OnKeyReactivationCallback } from '@proton/shared/lib/keys';
import { DecryptedKey, KeySalt, MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getMnemonicUserKeys, MnemonicKeyResponse } from '@proton/shared/lib/api/settingsMnemonic';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { computeKeyPassword } from '@proton/srp';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { removeItem, uniqueBy } from '@proton/shared/lib/helpers/array';
import { FormModal, InputFieldTwo, Loader, PasswordInputTwo, Tabs, useFormErrors } from '../../../components';
import { KeyReactivationRequest, KeyReactivationRequestState, KeyReactivationRequestStateData } from './interface';
import { useApi, useLoading, useModals, useNotifications, useUser } from '../../../hooks';
import { getInitialStates } from './state';
import { getReactivatedKeys } from './reactivateHelper';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import { AuthModal } from '../../password';
import useIsMnemonicAvailable from '../../../hooks/useIsMnemonicAvailable';
import BackupKeysTabContent from './BackupKeysTabContent';
import MnemonicInputField, { useMnemonicInputValidation } from '../../mnemonic/MnemonicInputField';

interface ReactivatedKeysState {
    numberOfSuccessfullyReactivatedKeys: number;
    numberOfFailedReactivatedKeys: number;
}

interface Props {
    onClose?: () => void;
    userKeys: DecryptedKey[];
    keyReactivationRequests: KeyReactivationRequest[];
    onProcess: (keysToReactivate: KeyReactivationRecord[], onReactivation: OnKeyReactivationCallback) => Promise<void>;
}

type TabId = 'recoveryPhrase' | 'password' | 'backupKey';

const ReactivateKeysModal = ({ userKeys, keyReactivationRequests, onProcess, onClose, ...rest }: Props) => {
    const api = useApi();

    const { validator, onFormSubmit } = useFormErrors();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [user] = useUser();

    const [loading, withLoading] = useLoading(true);
    const [isSubmitting, withIsSubmitting] = useLoading(false);
    const [states, setStates] = useState<KeyReactivationRequestState[]>([]);

    const [mnemonic, setMnemonic] = useState('');
    const mnemonicValidation = useMnemonicInputValidation(mnemonic);

    const [password, setPassword] = useState('');
    const [uploadedBackupKeys, setUploadedBackupKeys] = useState<OpenPGPKey[]>([]);
    const duplicateBackupKeysRef = useRef<OpenPGPKey[]>([]);

    const isMnemonicAvailable = useIsMnemonicAvailable();
    const showMnemonicTab =
        isMnemonicAvailable &&
        user.MnemonicStatus !== MNEMONIC_STATUS.DISABLED &&
        user.MnemonicStatus !== MNEMONIC_STATUS.ENABLED;

    const tabs: TabId[] = [showMnemonicTab ? 'recoveryPhrase' : undefined, 'password', 'backupKey'].filter(
        isTruthy
    ) as TabId[];
    const [tab, setTab] = useState(0);

    useEffect(() => {
        const run = async () => {
            const initialStates = await getInitialStates(keyReactivationRequests);
            setStates(initialStates);
        };
        void withLoading(run());
    }, [keyReactivationRequests]);

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

    const handleRecoveryPhraseUserKeysReactivation = async (userKeys: { ID: string; privateKey: OpenPGPKey }[]) => {
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
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={unlockPasswordChanges()} />);
        });
        const { MnemonicUserKeys } = await api<{ MnemonicUserKeys: MnemonicKeyResponse[] }>(getMnemonicUserKeys());

        const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);
        const decryptedMnemonicUserKeys = (
            await Promise.all(
                MnemonicUserKeys.map(async ({ ID, PrivateKey, Salt }) => {
                    try {
                        const hashedPassphrase = await computeKeyPassword(randomBytes, Salt);
                        const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, hashedPassphrase);
                        return {
                            ID,
                            privateKey: decryptedPrivateKey,
                        };
                    } catch (e) {
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
                text: c('Info').t`Unable to decrypt. Recovery phrase is not associated with any outdated keys.`,
            });
            return;
        }

        createNotification({
            type: 'info',
            text: c('Info').t`Unable to decrypt. Recovery phrase is not associated with any keys.`,
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

    const onBackupKeySubmit = async () => {
        const mapToUploadedPrivateKey = ({ id, Key, fingerprint }: KeyReactivationRequestStateData) => {
            const uploadedPrivateKey = uploadedBackupKeys.find((decryptedBackupKey) => {
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

    const handleDuplicatedKeysOnUpload = (duplicatedKeys: OpenPGPKey[]) => {
        const [first, second, third] = duplicatedKeys;

        const createAlreadyUploadedNotification = (key: OpenPGPKey) => {
            const fingerprint = key.getFingerprint();
            createNotification({
                type: 'info',
                text: c('info').t`Key ${fingerprint} has already been uploaded`,
            });
        };

        if (first) {
            createAlreadyUploadedNotification(first);
        }
        if (second) {
            createAlreadyUploadedNotification(second);
        }
        if (third) {
            createNotification({
                type: 'info',
                text: c('info').t`Additional duplicate keys detected. Please upload individually for more information.`,
            });
        }
    };

    const handleUpload = (privateKeys: OpenPGPKey[], acc: OpenPGPKey[]) => {
        const [currentKey, ...rest] = privateKeys;

        if (privateKeys.length === 0) {
            setUploadedBackupKeys((keys) => [...keys, ...acc]);
            const duplicatedKeys = uniqueBy(duplicateBackupKeysRef.current, (key) => key.getFingerprint());
            handleDuplicatedKeysOnUpload(duplicatedKeys);
            duplicateBackupKeysRef.current = [];
            return;
        }

        const currentKeyFingerprint = currentKey.getFingerprint();
        const keyAlreadyAdded = acc.find((key) => key.getFingerprint() === currentKeyFingerprint);
        if (keyAlreadyAdded) {
            handleUpload(rest, acc);
            return;
        }

        const keyAlreadyInList = uploadedBackupKeys.find((key) => key.getFingerprint() === currentKeyFingerprint);
        if (keyAlreadyInList) {
            duplicateBackupKeysRef.current.push(keyAlreadyInList);

            handleUpload(rest, acc);
            return;
        }

        const handleAddKey = (decryptedPrivateKey: OpenPGPKey) => {
            const newList = [...acc, decryptedPrivateKey];
            handleUpload(rest, newList);
        };

        if (currentKey.isDecrypted()) {
            currentKey
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - validate does not exist in the openpgp typings, todo
                .validate()
                .then(() => {
                    handleAddKey(currentKey);
                })
                .catch((e: Error) => {
                    createNotification({
                        type: 'error',
                        text: e.message,
                    });
                });
            return;
        }

        return createModal(
            <DecryptFileKeyModal
                privateKey={currentKey}
                onSuccess={(decryptedPrivateKey) => {
                    handleAddKey(decryptedPrivateKey);
                }}
            />
        );
    };

    const handleUploadKeys = (keys: OpenPGPKey[]) => {
        const privateKeys = keys.filter((key) => key.isPrivate());
        if (privateKeys.length === 0) {
            return createNotification({
                type: 'error',
                text:
                    keys.length === 1
                        ? c('Error').t`Uploaded file is not a valid private key. Please verify and try again.`
                        : c('Error').t`Uploaded files are not valid private keys. Please verify and try again.`,
            });
        }

        const numberOfNonPrivateKeys = keys.length - privateKeys.length;
        if (numberOfNonPrivateKeys > 0) {
            createNotification({
                type: 'info',
                text: c('Info').ngettext(
                    msgid`${numberOfNonPrivateKeys} uploaded file is not a valid private key. Please verify and try again.`,
                    `${numberOfNonPrivateKeys} uploaded files are not valid private keys. Please verify and try again.`,
                    numberOfNonPrivateKeys
                ),
            });
        }

        handleUpload(privateKeys, []);
    };

    const removeUploadedBackupKey = (keyToremove: OpenPGPKey) => {
        const index = uploadedBackupKeys.indexOf(keyToremove);

        if (index === -1) {
            return;
        }

        setUploadedBackupKeys((keys) => removeItem(keys, index));
    };

    return (
        <FormModal
            title={c('Title').t`Reactivate keys`}
            close={c('Action').t`Cancel`}
            submit={c('Action').t`Reactivate keys`}
            onClose={onClose}
            onSubmit={async () => {
                if (!onFormSubmit()) {
                    return;
                }

                const submit = async () => {
                    if (tab === tabs.indexOf('recoveryPhrase')) {
                        await onRecoveryPhraseSubmit();
                    } else if (tab === tabs.indexOf('password')) {
                        await onPasswordSubmit();
                    } else if (tab === tabs.indexOf('backupKey')) {
                        await onBackupKeySubmit();
                    }
                };

                await withIsSubmitting(submit());
                onClose?.();
            }}
            submitProps={{
                loading: isSubmitting,
                disabled: loading,
            }}
            intermediate
            {...rest}
        >
            {loading ? (
                <Loader />
            ) : (
                <>
                    <p>{c('Info')
                        .t`To access your old messages, you will need to reactivate your old encryption keys using one of the following recovery methods.`}</p>
                    <Tabs
                        value={tab}
                        tabs={[
                            showMnemonicTab
                                ? {
                                      // translator: 'Phrase' here refers to the 'Recovery phrase'
                                      title: c('Label').t`Phrase`,
                                      content: (
                                          <MnemonicInputField
                                              disableChange={isSubmitting}
                                              value={mnemonic}
                                              onValue={setMnemonic}
                                              autoFocus
                                              error={validator(
                                                  tab === tabs.indexOf('recoveryPhrase')
                                                      ? [requiredValidator(mnemonic), ...mnemonicValidation]
                                                      : []
                                              )}
                                          />
                                      ),
                                  }
                                : undefined,
                            {
                                title: c('Label').t`Password`,
                                content: (
                                    <InputFieldTwo
                                        id="password"
                                        label={c('Label').t`Password`}
                                        placeholder={c('Label').t`Password`}
                                        as={PasswordInputTwo}
                                        error={validator(
                                            tab === tabs.indexOf('password') ? [requiredValidator(password)] : []
                                        )}
                                        value={password}
                                        onValue={setPassword}
                                        autoFocus
                                        disabled={isSubmitting}
                                    />
                                ),
                            },
                            {
                                title: c('Label').t`Backup keys`,
                                content: (
                                    <BackupKeysTabContent
                                        uploadedBackupKeys={uploadedBackupKeys}
                                        onRemoveKey={removeUploadedBackupKey}
                                        handleUploadKeys={handleUploadKeys}
                                        disabled={isSubmitting}
                                        error={validator(
                                            tab === tabs.indexOf('backupKey')
                                                ? [
                                                      requiredValidator(
                                                          uploadedBackupKeys.map((key) => key.getFingerprint()).join()
                                                      ),
                                                  ]
                                                : []
                                        )}
                                    />
                                ),
                            },
                        ].filter(isTruthy)}
                        onChange={setTab}
                    />
                </>
            )}
        </FormModal>
    );
};

export default ReactivateKeysModal;
