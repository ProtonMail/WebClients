import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';

import { Actions, SimpleFilterModalModel } from '../interfaces';
import FilterActionsFormAutoReplyRow from './FilterActionsFormAutoReplyRow';
import FilterActionsFormFoldersRow from './FilterActionsFormFolderRow';
import FilterActionsFormLabelsRow from './FilterActionsFormLabelsRow';
import FilterActionsFormMarkAsRow from './FilterActionsFormMarkAsRow';

interface Props {
    labels: Label[];
    folders: Folder[];
    isNarrow: boolean;
    model: SimpleFilterModalModel;
    onChange: (newModel: SimpleFilterModalModel) => void;
    isEdit: boolean;
}

const FilterActionsForm = ({ isNarrow, labels, folders, model, onChange, isEdit }: Props) => {
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
            />
            <FilterActionsFormFoldersRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                folders={folders}
                isNarrow={isNarrow}
            />
            <FilterActionsFormMarkAsRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                isNarrow={isNarrow}
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
