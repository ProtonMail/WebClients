import { Dispatch, SetStateAction } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';
import { useNotifications } from '../../../hooks';
import KeyUploadContent from './KeyUploadContent';
import SelectRecoveryFiles, { Props as SelectRecoveryFilesProps } from '../shared/SelectRecoveryFiles';

interface Props {
    recoverySecrets: KeyWithRecoverySecret[];
    uploadedKeys: OpenPGPKey[];
    setUploadedKeys: Dispatch<SetStateAction<OpenPGPKey[]>>;
    disabled?: boolean;
    error?: string;
}

const RecoveryFileTabContent = ({ recoverySecrets, ...rest }: Props) => {
    const { createNotification } = useNotifications();

    const parseKeysOnUpload = (keys: OpenPGPKey[]) => {
        if (keys.length === 0) {
            createNotification({
                type: 'error',
                text: c('Error').t`Uploaded file is not a valid recovery file. Please verify and try again.`,
            });
            return;
        }

        return keys;
    };

    const SelectFilesComponent = (props: Omit<SelectRecoveryFilesProps, 'recoverySecrets'>) => (
        <SelectRecoveryFiles recoverySecrets={recoverySecrets} {...props} />
    );

    return (
        <KeyUploadContent
            id="recovery-file"
            label={c('Label').t`Recovery file`}
            placeholder={c('Label').t`Uploaded recovery file`}
            assistiveText={c('Label').t`Upload your recovery file`}
            additionalUploadText={c('Select files').t`Upload additional recovery files`}
            parseKeysOnUpload={parseKeysOnUpload}
            selectFilesComponent={SelectFilesComponent}
            {...rest}
        />
    );
};

export default RecoveryFileTabContent;
