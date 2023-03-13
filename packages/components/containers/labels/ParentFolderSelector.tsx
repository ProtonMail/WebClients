import { c } from 'ttag';

import { ROOT_FOLDER } from '@proton/shared/lib/constants';
import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { InputFieldTwo, Loader, Option, SelectTwo } from '../../components';
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
    const options = treeview.reduce<OptionProps[]>(
        (acc, folder) => reducer(acc, folder),
        [{ value: ROOT_FOLDER, text: c('Option').t`No parent folder` }]
    );

    return (
        <InputFieldTwo
            as={SelectTwo}
            label={label}
            id={id}
            className={className}
            value={value}
            onChange={({ value }: any) => onChange?.(value)}
        >
            {options.map((option) => {
                return <Option key={option.value} value={option.value} title={option.text.toString()} />;
            })}
        </InputFieldTwo>
    );
};

export default ParentFolderSelector;
