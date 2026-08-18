import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import { selectLegacySentinel } from './sentinelSelectors';

export const useIsSentinelUser = () => {
    const { loading, ...value } = useSelector(selectLegacySentinel);
    return [value, loading] as const;
};
