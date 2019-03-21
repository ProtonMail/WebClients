import { useContext, useRef, useEffect } from 'react';

const createUseModelHook = (Context) => () => {
    const [{ data, initialized, loading, error }, load] = useContext(Context);
    const shouldLoad = !initialized;
    const firstLoad = useRef(true);

    useEffect(() => {
        firstLoad.current = false;
        if (!shouldLoad) {
            return;
        }
        load();
    }, []);

    // Pre-set loading if it will be fetched on first load
    return [data, (firstLoad && shouldLoad) || loading, error];
};

export default createUseModelHook;
