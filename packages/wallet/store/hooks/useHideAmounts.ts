import { baseUseSelector as useSelector } from '@proton/react-redux-store';

import { selectHideAmounts } from '../slices/hideAmounts';

export const useHideAmounts = () => {
    const hideAmounts = useSelector(selectHideAmounts);

    return hideAmounts.value ?? false;
};
