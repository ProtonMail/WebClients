import React from 'react';

import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { Label } from 'proton-shared/lib/interfaces/Label';

import FilterActionsFormLabelsRow from './FilterActionsFormLabelsRow';
import FilterActionsFormFoldersRow from './FilterActionsFormFolderRow';
import FilterActionsFormMarkAsRow from './FilterActionsFormMarkAsRow';
import FilterActionsFormAutoReplyRow from './FilterActionsFormAutoReplyRow';

import { Actions, SimpleFilterModalModel } from '../interfaces';

interface Props {
    labels: Label[];
    folders: Folder[];
    isNarrow: boolean;
    model: SimpleFilterModalModel;
    onChange: (newModel: SimpleFilterModalModel) => void;
    isEdit: boolean;
    isDark: boolean;
}

const FilterActionsForm = ({ isNarrow, labels, folders, model, onChange, isEdit, isDark }: Props) => {
    const onUpdateActions = (payload: Partial<Actions>) => {
        onChange({
            ...model,
            actions: {
                ...model.actions,
                ...payload,
            },
        });
    };

    return (
        <>
            <FilterActionsFormLabelsRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                labels={labels}
                isNarrow={isNarrow}
                isDark={isDark}
            />
            <FilterActionsFormFoldersRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                folders={folders}
                isNarrow={isNarrow}
                isDark={isDark}
            />
            <FilterActionsFormMarkAsRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                isNarrow={isNarrow}
                isDark={isDark}
            />

            <FilterActionsFormAutoReplyRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                isNarrow={isNarrow}
                isEdit={isEdit}
            />
        </>
    );
};

export default FilterActionsForm;
