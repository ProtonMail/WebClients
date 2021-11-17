import { ComponentType, Dispatch, ReactNode, SetStateAction, useRef } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { removeItem, uniqueBy } from '@proton/shared/lib/helpers/array';
import { Button, Icon, InputFieldTwo, Table, TableBody, TableRow } from '../../../components';

import { useModals, useNotifications } from '../../../hooks';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import { Color, Shape } from '../../../components/button';

interface FileInputProps {
    multiple?: boolean;
    onUpload: (keys: OpenPGPKey[]) => void;
    disabled?: boolean;
    shape?: Shape;
    color?: Color;
    children: ReactNode;
}

interface Props {
    uploadedKeys: OpenPGPKey[];
    setUploadedKeys: Dispatch<SetStateAction<OpenPGPKey[]>>;
    disabled?: boolean;
    error?: string;
    id: string;
    label: string;
    placeholder?: string;
    assistiveText: string;
    selectFilesComponent: ComponentType<FileInputProps>;
}

const KeyUploadContent = ({
    uploadedKeys,
    setUploadedKeys,
    disabled,
    error,
    id,
    label,
    placeholder,
    assistiveText,
    selectFilesComponent: SelectFilesComponent,
}: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const duplicateBackupKeysRef = useRef<OpenPGPKey[]>([]);

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

    const handleUpload = (keysToUpload: OpenPGPKey[], acc: OpenPGPKey[]) => {
        const [currentKey, ...rest] = keysToUpload;

        if (keysToUpload.length === 0) {
            setUploadedKeys((keys) => [...keys, ...acc]);
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

        const keyAlreadyInList = uploadedKeys.find((key) => key.getFingerprint() === currentKeyFingerprint);
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
        handleUpload(keys, []);
    };

    const removeUploadedKey = (keyToRemove: OpenPGPKey) => {
        const index = uploadedKeys.indexOf(keyToRemove);

        if (index === -1) {
            return;
        }

        setUploadedKeys((keys) => removeItem(keys, index));
    };

    const SelectFiles = (props: Omit<FileInputProps, 'multiple' | 'onUpload' | 'disabled'>) => (
        <SelectFilesComponent {...props} multiple onUpload={handleUploadKeys} disabled={disabled} />
    );

    if (uploadedKeys.length) {
        return (
            <>
                <Table className="simple-table--has-actions">
                    <TableBody>
                        {uploadedKeys.map((key) => {
                            const fingerprint = key.getFingerprint();

                            return (
                                <TableRow
                                    key={fingerprint}
                                    cells={[
                                        <div
                                            key={1}
                                            className="flex flex-row flex-nowrap flex-align-items-center flex-justify-space-between"
                                        >
                                            <code className="max-w100 inline-block text-ellipsis" title={fingerprint}>
                                                {fingerprint}
                                            </code>
                                            <Button
                                                className="ml0-5"
                                                icon
                                                color="weak"
                                                shape="outline"
                                                onClick={() => removeUploadedKey(key)}
                                                disabled={disabled}
                                            >
                                                <Icon name="trash" alt={c('Label').t`Delete`} />
                                            </Button>
                                        </div>,
                                    ]}
                                    className="on-mobile-hide-td2 on-tiny-mobile-hide-td3"
                                />
                            );
                        })}
                    </TableBody>
                </Table>
                <SelectFiles shape="link" color="norm">
                    {c('Select files').t`Upload additional files`}
                </SelectFiles>
            </>
        );
    }

    return (
        <div className="flex flex-wrap on-mobile-flex-column flex-align-items-center">
            <div className="mr1 on-mobile-mr0 flex-item-fluid min-w14e">
                <InputFieldTwo
                    id={id}
                    label={label}
                    placeholder={placeholder}
                    assistiveText={assistiveText}
                    error={error}
                    readOnly
                />
            </div>
            <div className="mt0-25">
                <SelectFiles>{c('Select files').t`Browse`}</SelectFiles>
            </div>
        </div>
    );
};

export default KeyUploadContent;
