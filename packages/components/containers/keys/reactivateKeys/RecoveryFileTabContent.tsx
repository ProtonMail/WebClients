import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import type { PrivateKeyReference } from '@proton/crypto';
import type { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';

import KeyUploadContent from './KeyUploadContent';
import type { Props as SelectRecoveryFilesProps } from './SelectRecoveryFiles';
import SelectRecoveryFiles from './SelectRecoveryFiles';

interface Props {
    recoverySecrets: KeyWithRecoverySecret[];
    uploadedKeys: PrivateKeyReference[];
    setUploadedKeys: Dispatch<SetStateAction<PrivateKeyReference[]>>;
    disabled?: boolean;
    error?: string;
}

const RecoveryFileTabContent = ({ recoverySecrets, ...rest }: Props) => {
    const SelectFilesComponent = (props: Omit<SelectRecoveryFilesProps, 'recoverySecrets'>) => (
        <SelectRecoveryFiles recoverySecrets={recoverySecrets} {...props} />
    );

    const recoveryFileAvailable = !!recoverySecrets.length;
    const assistiveText = recoveryFileAvailable
        ? c('Label').t`Upload 1 or more recovery files or encryption keys`
        : c('Label').t`Upload 1 or more encryption keys`;

    return (
        <KeyUploadContent
            id="recovery-file"
            label={c('Label').t`Recovery file`}
            assistiveText={assistiveText}
            selectFilesComponent={SelectFilesComponent}
            {...rest}
        />
    );
};

export default RecoveryFileTabContent;
