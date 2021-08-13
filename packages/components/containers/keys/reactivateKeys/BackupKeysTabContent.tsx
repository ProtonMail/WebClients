import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { Button, Icon, InputFieldTwo, Table, TableBody, TableRow } from '../../../components';
import SelectKeyFiles, { SelectKeyFilesProps } from '../shared/SelectKeyFiles';

interface Props {
    uploadedBackupKeys: OpenPGPKey[];
    onRemoveKey: (keyToremove: OpenPGPKey) => void;
    handleUploadKeys: (keys: OpenPGPKey[]) => void;
    disabled?: boolean;
    error?: string;
}

const BackupKeysTabContent = ({ uploadedBackupKeys, onRemoveKey, handleUploadKeys, disabled, error }: Props) => {
    const SelectBackupKeyFiles = (props: Omit<Omit<Omit<SelectKeyFilesProps, 'multiple'>, 'onUpload'>, 'disabled'>) => (
        <SelectKeyFiles {...props} multiple onUpload={handleUploadKeys} disabled={disabled} />
    );

    if (uploadedBackupKeys.length) {
        return (
            <>
                <Table className="simple-table--has-actions">
                    <TableBody>
                        {uploadedBackupKeys.map((key) => {
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
                                                onClick={() => onRemoveKey(key)}
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
                <SelectBackupKeyFiles shape="link" color="norm">
                    {c('Select files').t`Upload additional private keys`}
                </SelectBackupKeyFiles>
            </>
        );
    }

    return (
        <div className="flex flex-wrap on-mobile-flex-column flex-align-items-center">
            <div className="mr1 on-mobile-mr0 flex-item-fluid min-w14e">
                <InputFieldTwo
                    id="backup-key"
                    label={c('Label').t`Backup key`}
                    placeholder={c('Label').t`Uploaded private keys`}
                    assistiveText={c('Label').t`Upload your backup key`}
                    error={error}
                    readOnly
                />
            </div>
            <div className="mt0-25">
                <SelectBackupKeyFiles>{c('Select files').t`Browse`}</SelectBackupKeyFiles>
            </div>
        </div>
    );
};

export default BackupKeysTabContent;
