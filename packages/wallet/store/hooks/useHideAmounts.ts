import { baseUseSelector as useSelector } from '@proton/react-redux-store/ProtonStoreContext';

import { selectHideAmounts } from '../slices/hideAmounts';

export const useHideAmounts = () => {
    const hideAmounts = useSelector(selectHideAmounts);

    return hideAmounts.value ?? false;
};
