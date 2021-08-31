import { Dispatch, SetStateAction } from 'react';
import { c, msgid } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { useNotifications } from '../../../hooks';
import KeyUploadContent from './KeyUploadContent';
import SelectKeyFiles from '../shared/SelectKeyFiles';

interface Props {
    uploadedKeys: OpenPGPKey[];
    setUploadedKeys: Dispatch<SetStateAction<OpenPGPKey[]>>;
    disabled?: boolean;
    error?: string;
}

const BackupKeysTabContent = (props: Props) => {
    const { createNotification } = useNotifications();

    const parseKeysOnUpload = (keys: OpenPGPKey[]) => {
        const privateKeys = keys.filter((key) => key.isPrivate());
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

        const numberOfNonPrivateKeys = keys.length - privateKeys.length;
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

        return privateKeys;
    };

    return (
        <KeyUploadContent
            id="backup-key"
            label={c('Label').t`Backup key`}
            placeholder={c('Label').t`Uploaded private keys`}
            assistiveText={c('Label').t`Upload your backup key`}
            additionalUploadText={c('Select files').t`Upload additional private keys`}
            parseKeysOnUpload={parseKeysOnUpload}
            selectFilesComponent={SelectKeyFiles}
            {...props}
        />
    );
};

export default BackupKeysTabContent;
