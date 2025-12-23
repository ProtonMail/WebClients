import { useState } from 'react';

import { c } from 'ttag';

import { reactivateKeysThunk } from '@proton/account/addressKeys/reactivateKeysActions';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { getKeyReactivationNotification } from '@proton/components/containers/keys/reactivateKeys/reactivateHelper';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useRecoverySecrets from '@proton/components/hooks/useRecoverySecrets';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { KeyReactivationRequestStateData } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

import type { ProcessedKey } from '../importKeys/useProcessKey';
import { FileContent } from './FileContent';
import type { ReactivateKeysContentProps } from './interface';

export const FileFormId = 'file-form';

export const FileForm = ({ keyReactivationStates, loading, onLoading, onClose }: ReactivateKeysContentProps) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [uploadedFileKeys, setUploadedFileKeys] = useState<ProcessedKey[]>([]);
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const handleSubmit = async () => {
        try {
            onLoading(true);

            const mapToUploadedPrivateKey = ({ id, Key, fingerprint }: KeyReactivationRequestStateData) => {
                const uploadedPrivateKey = uploadedFileKeys.find((decryptedBackupKey) => {
                    return fingerprint === decryptedBackupKey.armoredKeyWithInfo.fingerprint;
                })?.privateKey;
                if (!uploadedPrivateKey) {
                    return;
                }
                return {
                    id,
                    Key,
                    privateKey: uploadedPrivateKey,
                };
            };

            const records = keyReactivationStates
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

            createNotification(
                getKeyReactivationNotification(await dispatch(reactivateKeysThunk({ keyReactivationRecords: records })))
            );

            onClose?.();
        } catch (error) {
            handleError(error);
        } finally {
            onLoading(false);
        }
    };

    const recoverySecrets = useRecoverySecrets();
    const recoveryFileAvailable = !!recoverySecrets.length;

    const fileDescription = recoveryFileAvailable
        ? c('Info').t`This is a recovery file or encryption key you may have previously saved.`
        : c('Info').t`This is an encryption key you may have previously saved.`;

    return (
        <form
            id={FileFormId}
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                void handleSubmit();
            }}
        >
            <div className="mb-4">{fileDescription}</div>
            <FileContent
                recoverySecrets={recoverySecrets}
                uploadedKeys={uploadedFileKeys}
                setUploadedKeys={setUploadedFileKeys}
                disabled={loading}
                error={validator([
                    requiredValidator(uploadedFileKeys.map((key) => key.armoredKeyWithInfo.fingerprint).join()),
                ])}
            />
        </form>
    );
};
