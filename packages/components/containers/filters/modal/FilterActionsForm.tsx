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
    model: SimpleFilterModalModel;
    onChange: (newModel: SimpleFilterModalModel) => void;
    isEdit: boolean;
}

const FilterActionsForm = ({ labels, folders, model, onChange, isEdit }: Props) => {
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
            <FilterActionsFormLabelsRow actions={model.actions} handleUpdateActions={onUpdateActions} labels={labels} />
            <FilterActionsFormFoldersRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                folders={folders}
            />
            <FilterActionsFormMarkAsRow actions={model.actions} handleUpdateActions={onUpdateActions} />

            <FilterActionsFormAutoReplyRow
                actions={model.actions}
                handleUpdateActions={onUpdateActions}
                isEdit={isEdit}
            />
        </>
    );
};

export default FilterActionsForm;
