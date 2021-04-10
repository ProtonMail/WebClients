import React from 'react';
import { c } from 'ttag';

import { buildTreeview, formatFolderName } from 'proton-shared/lib/helpers/folder';
import { ROOT_FOLDER } from 'proton-shared/lib/constants';
import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';

import { Loader, Select } from '../../components';
import { useFolders } from '../../hooks';
import { OptionProps } from '../../components/select/Select';

// ROOT_FOLDER is transformed to a String when coming from target.value
const formatValue = (value: string) => (value === `${ROOT_FOLDER}` ? ROOT_FOLDER : value);

interface Props {
    id: string;
    className?: string;
    value: string | number;
    onChange?: (parentID: string | number) => void;
    disableOptions: string[];
}

const ParentFolderSelector = ({ id, value, onChange, className, disableOptions = [] }: Props) => {
    const [folders, loading] = useFolders();

    if (loading) {
        return <Loader />;
    }

    const formatOption = ({ Name, ID }: FolderWithSubFolders, level = 0): OptionProps => ({
        disabled: disableOptions.includes(ID),
        value: ID,
        text: formatFolderName(level, Name, ' ∙ '),
    });

    const reducer = (acc: OptionProps[] = [], folder: FolderWithSubFolders, level = 0) => {
        acc.push(formatOption(folder, level));

        if (Array.isArray(folder.subfolders)) {
            folder.subfolders.forEach((folder) => reducer(acc, folder, level + 1));
        }

        return acc;
    };

    const treeview = buildTreeview(folders);
    const options = treeview.reduce<OptionProps[]>((acc, folder) => reducer(acc, folder), [
        { value: ROOT_FOLDER, text: c('Option').t`No parent folder` },
    ]);

    return (
        <Select
            id={id}
            className={className}
            value={value}
            options={options}
            onChange={({ target }) => onChange?.(formatValue(target.value))}
        />
    );
};

export default ParentFolderSelector;
