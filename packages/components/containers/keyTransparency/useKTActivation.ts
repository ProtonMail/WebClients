import { useSelector } from '@proton/redux-shared-store';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

const useKTActivation = (): KeyTransparencyActivation => {
    return useSelector((state) => state.kt.value);
};

export default useKTActivation;
