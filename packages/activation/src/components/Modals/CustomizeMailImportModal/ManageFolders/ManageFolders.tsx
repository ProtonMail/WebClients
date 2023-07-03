import { c } from 'ttag';

import { MailImportFields } from '../CustomizeMailImportModal.interface';
import ManageFoldersHeader from './ManageFoldersHeader';
import ManageFoldersRow from './ManageFoldersRow/ManageFoldersRow';
import useManageFolders from './useManageFolders';

interface Props {
    fromEmail: string;
    isLabelMapping: boolean;
    mapping: MailImportFields['mapping'];
    onChange: (nextMapping: MailImportFields['mapping']) => void;
    onErroredInputSaved: (fieldId: MailImportFields['mapping'][number]['id']) => void;
    toEmail: MailImportFields['importAddress']['Email'];
}

const ManageFolders = ({ toEmail, mapping, isLabelMapping, fromEmail, onChange, onErroredInputSaved }: Props) => {
    const { handleToggleCheckbox, items, handleRenameItem } = useManageFolders({
        isLabelMapping,
        mapping,
        onChange,
    });

    return (
        <>
            <ManageFoldersHeader fromLabel={c('Label').t`From: ${fromEmail}`} toLabel={c('Label').t`To: ${toEmail}`} />

            <div className="flex mb-4">
                <div className="flex-item-fluid pt-2">
                    <ul className="unstyled m-0">
                        {items.map((item, index) => {
                            // We don't display folder with categories since they are merged
                            // We need them to keep the folder mapping intact so we return null instead of filtering the array
                            if (item.category) {
                                return null;
                            }

                            return (
                                <ManageFoldersRow
                                    key={item.id}
                                    index={index}
                                    folderItem={item}
                                    onRename={handleRenameItem}
                                    onErrorSaved={() => onErroredInputSaved(item.id)}
                                    onToggleCheck={handleToggleCheckbox}
                                />
                            );
                        })}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default ManageFolders;
