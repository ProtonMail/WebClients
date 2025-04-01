import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

import { isMessage as testIsMessage } from '../../../helpers/elements';
import type { ApplyLabelsParams } from './interface';
import { useApplyLabelsToAll } from './useApplyLabelsToAll';
import { useApplyLabelsToSelection } from './useApplyLabelsToSelection';

export const useApplyLabels = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const applyLabelsToSelection = useApplyLabelsToSelection();
    const { applyLabelsToAll, applyLabelsToAllModal } = useApplyLabelsToAll(setContainFocus);

    const applyLabels = useCallback(
        async ({
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
        },
        [applyLabelsToAll, applyLabelsToSelection]
    );

    return { applyLabels, applyLabelsToAllModal };
};
