import { useMemo } from 'react';

import { c } from 'ttag';

import { ROOT_FOLDER } from '@proton/shared/lib/constants';
import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { InputFieldTwo, Loader, Option, SearchableSelect } from '../../components';
import { OptionProps } from '../../components/select/Select';
import { useFolders } from '../../hooks';

interface Props {
    id: string;
    className?: string;
    value: string | number;
    label: string;
    onChange?: (parentID: string | number) => void;
    disableOptions: string[];
}

const ParentFolderSelector = ({ id, value, label, onChange, className, disableOptions = [] }: Props) => {
    const [folders, loading] = useFolders();

    const options = useMemo(() => {
        if (loading) {
            return [];
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
        return treeview.reduce<OptionProps[]>(
            (acc, folder) => reducer(acc, folder),
            [{ value: ROOT_FOLDER, text: c('Option').t`No parent folder` }]
        );
    }, [loading]);

    if (loading) {
        return <Loader />;
    }

    return (
        <InputFieldTwo
            as={SearchableSelect<string | number>}
            className={className}
            data-testid="parent-folder-select"
            id={id}
            label={label}
            onChange={({ value }: any) => onChange?.(value)}
            placeholder={c('Placeholder').t`Search parent folder`}
            value={value}
        >
            {options.map((option) => (
                <Option key={option.value} value={option.value} title={option.text.toString()} />
            ))}
        </InputFieldTwo>
    );
};

export default ParentFolderSelector;
