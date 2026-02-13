import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';

import type { FolderMapItem, MailImportFields } from '../CustomizeMailImportModal.interface';
import { formatItems, formatMapping, renameChildFolders } from './useManageFolders.helpers';

interface Props {
    mapping: MailImportFields['mapping'];
    onChange: (nextMapping: MailImportFields['mapping']) => void;
    isLabelMapping: boolean;
}

const useManageFolders = ({ mapping, isLabelMapping, onChange }: Props) => {
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();

    const items: FolderMapItem[] = formatItems({ mapping, isLabelMapping, folders, labels });

    const handleToggleCheckbox = (index: number, checked: boolean) => {
        const newFolders = [...items];
        newFolders[index].checked = checked;

        const updatedFolder = newFolders[index];

        const final = newFolders.map((val) => {
            if (updatedFolder.folderChildIDS.includes(val.id)) {
                val.checked = checked;
                val.disabled = !checked;
            }
            return val;
        });

        onChange(formatMapping(final));
    };

    const handleRenameItem = (index: number, newName: string) => {
        const newFolders = [...items];
        const newFolder = { ...newFolders[index] };
        newFolder.protonPath = [...newFolder.protonPath];
        newFolder.protonPath[newFolder.protonPath.length - 1] = newName;

        newFolders[index] = newFolder;

        const updatedFolders = renameChildFolders(newFolder, newFolders, newName, isLabelMapping);

        onChange(formatMapping(updatedFolders));
    };

    return {
        items,
        handleRenameItem,
        handleToggleCheckbox,
    };
};

export default useManageFolders;
