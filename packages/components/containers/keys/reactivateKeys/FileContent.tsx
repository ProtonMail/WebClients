import { c } from 'ttag';

import type { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';

import { KeyUploadContent, type KeyUploadContentProps } from './KeyUploadContent';
import type { Props as SelectRecoveryFilesProps } from './SelectRecoveryFiles';
import SelectRecoveryFiles from './SelectRecoveryFiles';

interface Props {
    recoverySecrets: KeyWithRecoverySecret[];
    uploadedKeys: KeyUploadContentProps['uploadedKeys'];
    setUploadedKeys: KeyUploadContentProps['setUploadedKeys'];
    disabled?: boolean;
    error?: string;
}

export const FileContent = ({ recoverySecrets, ...rest }: Props) => {
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
