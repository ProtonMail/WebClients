import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableRow from '@proton/components/components/table/TableRow';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useNotifications from '@proton/components/hooks/useNotifications';
import { CryptoProxy } from '@proton/crypto';
import type { ArmoredKeyWithInfo } from '@proton/shared/lib/keys';
import removeItem from '@proton/utils/removeIndex';
import uniqueBy from '@proton/utils/uniqueBy';

import { type ProcessedKey, useProcessKey } from '../importKeys/useProcessKey';

interface FileInputProps {
    multiple?: boolean;
    onUpload: (keys: ArmoredKeyWithInfo[]) => void;
    disabled?: boolean;
    shape?: ButtonProps['shape'];
    color?: ButtonProps['color'];
    children: ReactNode;
}

export interface KeyUploadContentProps {
    uploadedKeys: ProcessedKey[];
    setUploadedKeys: Dispatch<SetStateAction<ProcessedKey[]>>;
    disabled?: boolean;
    error?: string;
    id: string;
    label: string;
    placeholder?: string;
    assistiveText: string;
    selectFilesComponent: ComponentType<FileInputProps>;
}

export const KeyUploadContent = ({
    uploadedKeys,
    setUploadedKeys,
    disabled,
    error,
    id,
    label,
    placeholder,
    assistiveText,
    selectFilesComponent: SelectFilesComponent,
}: KeyUploadContentProps) => {
    const { createNotification } = useNotifications();

    const handleDuplicatedKeysOnUpload = (duplicatedKeys: ProcessedKey[]) => {
        const [first, second, third] = duplicatedKeys;

        const createAlreadyUploadedNotification = (key: ProcessedKey) => {
            const fingerprint = key.armoredKeyWithInfo.fingerprint;
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

    const removeUploadedKey = (keyToRemove: ProcessedKey) => {
        const index = uploadedKeys.indexOf(keyToRemove);
        void CryptoProxy.clearKey({ key: keyToRemove.privateKey }); // erase private key material

        if (index === -1) {
            return;
        }

        setUploadedKeys(removeItem(uploadedKeys, index));
    };

    const processKey = useProcessKey({
        onProcessed: (processedKeys) => {
            const fingerprints = new Set(uploadedKeys.map((key) => key.armoredKeyWithInfo.fingerprint));
            const duplicatedKeys = processedKeys.filter((key) => fingerprints.has(key.armoredKeyWithInfo.fingerprint));
            handleDuplicatedKeysOnUpload(duplicatedKeys);
            const uniqueKeys = uniqueBy(
                [...uploadedKeys, ...processedKeys],
                (key) => key.armoredKeyWithInfo.fingerprint
            );
            setUploadedKeys(uniqueKeys);
        },
    });

    const handleUploadKeys = (keys: ArmoredKeyWithInfo[]) => {
        void processKey.handleUploadKeys(keys);
    };

    const SelectFiles = (props: Omit<FileInputProps, 'multiple' | 'onUpload' | 'disabled'>) => (
        <SelectFilesComponent {...props} multiple onUpload={handleUploadKeys} disabled={disabled} />
    );

    return (
        <>
            {processKey.component}
            {uploadedKeys.length ? (
                <>
                    <Table hasActions>
                        <TableBody>
                            {uploadedKeys.map((key) => {
                                const fingerprint = key.armoredKeyWithInfo.fingerprint;

                                return (
                                    <TableRow
                                        key={fingerprint}
                                        cells={[
                                            <div
                                                key={1}
                                                className="flex flex-row flex-nowrap items-center justify-space-between"
                                            >
                                                <code
                                                    className="max-w-full inline-block text-ellipsis"
                                                    title={fingerprint}
                                                >
                                                    {fingerprint}
                                                </code>
                                                <Button
                                                    className="ml-2 shrink-0"
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
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                    <SelectFiles shape="underline" color="norm">
                        {c('Select files').t`Upload additional files`}
                    </SelectFiles>
                </>
            ) : (
                <div className="flex flex-wrap flex-column md:flex-row items-center">
                    <div className="mr-0 md:mr-4 md:flex-1 min-w-custom" style={{ '--min-w-custom': '14em' }}>
                        <InputFieldTwo
                            id={id}
                            label={label}
                            placeholder={placeholder}
                            assistiveText={assistiveText}
                            error={error}
                            readOnly
                        />
                    </div>
                    <div className="mt-1">
                        <SelectFiles>{c('Select files').t`Browse`}</SelectFiles>
                    </div>
                </div>
            )}
        </>
    );
};
