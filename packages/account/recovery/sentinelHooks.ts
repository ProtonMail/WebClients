import { selectLegacySentinel } from '@proton/account/recovery/sentinelSelectors';
import { useSelector } from '@proton/redux-shared-store';

export const useIsSentinelUser = () => {
    const { loading, ...value } = useSelector(selectLegacySentinel);
    return [value, loading] as const;
};
