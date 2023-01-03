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
    toEmail: MailImportFields['importAddress']['Email'];
    setNoEdits: (value: boolean) => void;
}

const ManageFolders = ({ toEmail, mapping, isLabelMapping, fromEmail, onChange, setNoEdits }: Props) => {
    const { handleToggleCheckbox, items, updateIsEditing, handleRenameItem } = useManageFolders({
        isLabelMapping,
        mapping,
        onChange,
        setNoEdits,
    });

    return (
        <>
            <ManageFoldersHeader fromLabel={c('Label').t`From: ${fromEmail}`} toLabel={c('Label').t`To: ${toEmail}`} />

            <div className="flex mb1">
                <div className="flex-item-fluid pt0-5">
                    <ul className="unstyled m0">
                        {items.map((item, index) => (
                            <ManageFoldersRow
                                key={item.id}
                                index={index}
                                folderItem={item}
                                onRename={handleRenameItem}
                                onToggleCheck={handleToggleCheckbox}
                                updateEditing={updateIsEditing}
                            />
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default ManageFolders;
