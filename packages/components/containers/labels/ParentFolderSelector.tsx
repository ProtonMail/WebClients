import { useMemo } from 'react';

import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import { ROOT_FOLDER } from '@proton/shared/lib/constants';
import { buildTreeview, formatFolderName } from '@proton/shared/lib/helpers/folder';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { InputFieldTwo, Option, SearchableSelect } from '../../components';
import type { OptionProps } from '../../components/select/Select';
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

        const isDisabledOption = (() => {
            const disabledOptionIdsCache = [...disableOptions];
            return (ID: string, ParentID: string | number | undefined) => {
                const isDisabled =
                    disabledOptionIdsCache.includes(ID) ||
                    (ParentID !== undefined &&
                        typeof ParentID === 'string' &&
                        disabledOptionIdsCache.includes(ParentID));

                if (isDisabled) {
                    disabledOptionIdsCache.push(ID);
                }

                return isDisabled;
            };
        })();

        const formatOption = ({ Name, ID, ParentID }: FolderWithSubFolders, level = 0): OptionProps => ({
            disabled: isDisabledOption(ID, ParentID),
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
            searchPlaceholder={c('Placeholder').t`Search parent folder`}
            value={value}
        >
            {options.map((option) => (
                <Option
                    key={option.value}
                    value={option.value}
                    title={option.text.toString()}
                    disabled={option.disabled}
                />
            ))}
        </InputFieldTwo>
    );
};

export default ParentFolderSelector;
