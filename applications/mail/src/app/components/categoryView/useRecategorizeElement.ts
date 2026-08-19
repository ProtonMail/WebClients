import isTruthy from '@proton/utils/isTruthy';

import { APPLY_LOCATION_TYPES } from '../../hooks/actions/applyLocation/interface';
import { useApplyLocation } from '../../hooks/actions/applyLocation/useApplyLocation';
import { useGetElementByID } from '../../hooks/mailbox/useElements';

export const useRecategorizeElement = () => {
    const { applyLocation } = useApplyLocation();
    const getElementByID = useGetElementByID();

    const recategorizeElement = async (categoryId: string, itemIds: string[]) => {
        const elements = itemIds.map((id) => getElementByID(id)).filter(isTruthy);
        void applyLocation({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements,
            destinationLabelID: categoryId,
        });
    };

    return recategorizeElement;
};
