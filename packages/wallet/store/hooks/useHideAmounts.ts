import { baseUseSelector as useSelector } from '@proton/react-redux-store';
import { selectHideAmounts } from '@proton/wallet/store';

export const useHideAmounts = () => {
    const hideAmounts = useSelector(selectHideAmounts);

    return hideAmounts.value ?? false;
};
