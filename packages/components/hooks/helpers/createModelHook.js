import useCachedModelResult from '../useCachedModelResult';
import useApi from '../../containers/api/useApi';

/**
 * Creates an async fn model hook.
 * @return {function} the created hook
 */
const createUseModelHook = ({ key, get }) => {
    return () => {
        const api = useApi();
        return useCachedModelResult(key, () => get(api));
    };
};

export default createUseModelHook;
