import type { ReactNode, Ref } from 'react';
import { forwardRef, useEffect, useRef } from 'react';

import { c, msgid } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import FileInput from '@proton/components/components/input/FileInput';
import { useCombinedRefs } from '@proton/hooks';
import { KEY_FILE_EXTENSION } from '@proton/shared/lib/constants';
import { readFileAsString } from '@proton/shared/lib/helpers/file';
import type { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';
import type { ArmoredKeyWithInfo } from '@proton/shared/lib/keys';
import { parseKeys } from '@proton/shared/lib/keys';
import { parseRecoveryFiles } from '@proton/shared/lib/recoveryFile/recoveryFile';

import { useNotifications } from '../../../hooks';

const RECOVERY_FILE_EXPR = /-----BEGIN PGP MESSAGE-----(?:(?!-----)[\s\S])*-----END PGP MESSAGE-----/g;

const BACKUP_PRIVATE_KEY_EXPR =
    /-----BEGIN PGP PRIVATE KEY BLOCK-----(?:(?!-----)[\s\S])*-----END PGP PRIVATE KEY BLOCK-----/g;

export interface Props {
    recoverySecrets: KeyWithRecoverySecret[];
    onUpload: (keys: ArmoredKeyWithInfo[]) => void;
    autoClick?: boolean;
    multiple?: boolean;
    className?: string;
    children?: ReactNode;
    disabled?: boolean;
    shape?: ButtonProps['shape'];
    color?: ButtonProps['color'];
}

const SelectRecoveryFiles = (
    {
        recoverySecrets,
        onUpload,
        autoClick = false,
        multiple = false,
        className = '',
        children = c('Select files').t`Upload`,
        disabled,
        shape,
        color,
    }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (autoClick) {
            fileRef.current?.click();
        }
    }, [autoClick]);

    const displayRecoveryFileNotifications = (keys: ArmoredKeyWithInfo[], numberOfFilesUploaded: number) => {
        if (numberOfFilesUploaded === 0) {
            return;
        }

        if (keys.length === 0) {
            createNotification({
                type: 'error',
                text:
                    numberOfFilesUploaded === 1
                        ? c('Error').t`The keys in your recovery file can't be validated. Please contact support.`
                        : c('Error')
                              .t`The keys in your recovery files can't be validated. Please upload individually for more information.`,
            });
        }
    };

    const displayBackupKeyNotifications = (keys: ArmoredKeyWithInfo[], numberOfFilesUploaded: number) => {
        if (numberOfFilesUploaded === 0) {
            return;
        }

        const privateKeys = keys.filter(({ keyIsPrivate }) => keyIsPrivate);
        if (privateKeys.length === 0) {
            createNotification({
                type: 'error',
                text:
                    keys.length === 1
                        ? c('Error').t`Uploaded file is not a valid private key. Please verify and try again.`
                        : c('Error').t`Uploaded files are not valid private keys. Please verify and try again.`,
            });
            return;
        }

        const numberOfNonPrivateKeys = numberOfFilesUploaded - privateKeys.length;
        if (numberOfNonPrivateKeys > 0) {
            createNotification({
                type: 'info',
                text:
                    numberOfNonPrivateKeys === 1
                        ? c('Info').t`Uploaded file is not a valid private key. Please verify and try again.`
                        : // translator: the singular version won't be used, it's the string "Uploaded file is not a valid private key. Please verify and try again." that will be used.
                          c('Info').ngettext(
                              msgid`${numberOfNonPrivateKeys} uploaded file is not a valid private key. Please verify and try again.`,
                              `${numberOfNonPrivateKeys} uploaded files are not valid private keys. Please verify and try again.`,
                              numberOfNonPrivateKeys
                          ),
            });
        }
    };

    return (
        <FileInput
            accept={KEY_FILE_EXTENSION}
            ref={useCombinedRefs(fileRef, ref)}
            className={className}
            multiple={multiple}
            onChange={async ({ target }) => {
                const files = Array.from(target.files as FileList);

                const filesAsStrings = await Promise.all(files.map((file) => readFileAsString(file))).catch(() => []);
                const concatenatedFilesAsString = filesAsStrings.join('\n');

                const recoveryFilesAsStrings = concatenatedFilesAsString.match(RECOVERY_FILE_EXPR) || [];
                const backupKeysAsStrings = concatenatedFilesAsString.match(BACKUP_PRIVATE_KEY_EXPR) || [];

                const [recoveryFileKeys, backupKeyFileKeys] = await Promise.all([
                    parseRecoveryFiles(recoveryFilesAsStrings, recoverySecrets),
                    parseKeys(backupKeysAsStrings),
                ]);

                displayRecoveryFileNotifications(recoveryFileKeys, recoveryFilesAsStrings.length);
                displayBackupKeyNotifications(backupKeyFileKeys, backupKeysAsStrings.length);

                onUpload([...recoveryFileKeys, ...backupKeyFileKeys]);
            }}
            disabled={disabled}
            shape={shape}
            color={color}
        >
            {children}
        </FileInput>
    );
};

export default forwardRef<HTMLInputElement, Props>(SelectRecoveryFiles);
