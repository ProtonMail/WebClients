import { useSelector } from '../store/hooks';
import { selectKeyReactivationRequests } from './index';

export const useInactiveKeys = () => {
    return useSelector(selectKeyReactivationRequests);
};
