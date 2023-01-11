import { useEffect, useState } from 'react';

import { useFolders, useLabels } from '@proton/components/hooks';

import { FolderMapItem, MailImportFields } from '../CustomizeMailImportModal.interface';
import { formatItems, formatMapping } from './useManageFolders.helpers';

interface Props {
    mapping: MailImportFields['mapping'];
    onChange: (nextMapping: MailImportFields['mapping']) => void;
    isLabelMapping: boolean;
    setNoEdits: (value: boolean) => void;
}

const useManageFolders = ({ mapping, isLabelMapping, onChange, setNoEdits }: Props) => {
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();

    const items: FolderMapItem[] = formatItems({ mapping, isLabelMapping, folders, labels });
    const [isEditing, setIsEditing] = useState<boolean[]>(() => items.map((item) => item.errors.length > 0));

    const updateIsEditing = (index: number) => {
        const newIsEditing = [...isEditing];
        newIsEditing[index] = false;
        setIsEditing(newIsEditing);
    };

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
        onChange(formatMapping(newFolders));
    };

    useEffect(() => {
        if (isEditing.every((item) => !item)) {
            setNoEdits(true);
        }
    }, [isEditing]);

    return {
        items,
        updateIsEditing,
        handleRenameItem,
        handleToggleCheckbox,
    };
};

export default useManageFolders;
