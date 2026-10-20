import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';

const useKTActivation = (): KeyTransparencyActivation => {
    return useSelector((state) => state.kt.value);
};

export default useKTActivation;
