import { useSelector } from '../store/hooks';
import { selectLegacySentinel } from './sentinelSelectors';

export const useIsSentinelUser = () => {
    const { loading, ...value } = useSelector(selectLegacySentinel);
    return [value, loading] as const;
};
