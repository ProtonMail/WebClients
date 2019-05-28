import { useApi, useCachedAsyncResult } from 'react-components';

/**
 * Creates an async fn model hook.
 * @return {function} the created hook
 */
const createUseModelHook = ({ key, get }) => {
    return () => {
        const api = useApi();
        return useCachedAsyncResult(key, () => get(api), []);
    };
};

export default createUseModelHook;
