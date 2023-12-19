import { Dispatch, SetStateAction } from 'react';

import { isMessage as testIsMessage } from '../../../helpers/elements';
import { Element } from '../../../models/element';
import { useApplyLabelsToAll } from './useApplyLabelsToAll';
import { useApplyLabelsToSelection } from './useApplyLabelsToSelection';

export interface ApplyLabelsParams {
    elements: Element[];
    changes: { [labelID: string]: boolean };
    createFilters?: boolean;
    silent?: boolean;
    selectedLabelIDs?: string[];
    labelID: string;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}

export const useApplyLabels = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const applyLabelsToSelection = useApplyLabelsToSelection();
    const { applyLabelsToAll, applyLabelsToAllModal } = useApplyLabelsToAll(setContainFocus);

    const applyLabels = async ({
        elements,
        changes,
        createFilters = false,
        silent = false,
        selectedLabelIDs = [],
        labelID,
        selectAll,
        onCheckAll,
    }: ApplyLabelsParams) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);

        if (selectAll) {
            await applyLabelsToAll({
                changes,
                isMessage,
                fromLabelID: labelID,
                onCheckAll,
            });
        } else {
            await applyLabelsToSelection({
                elements,
                changes,
                createFilters,
                silent,
                selectedLabelIDs,
                isMessage,
                labelID,
            });
        }
    };

    return { applyLabels, applyLabelsToAllModal };
};
