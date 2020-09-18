import { useContext } from 'react';
import { GlobalLoaderContext, TaskOptions } from './GlobalLoaderProvider';

type WithGlobalLoading = <T>(promise: Promise<T>) => Promise<T>;

function useGlobalLoader(defaultTaskOptions: TaskOptions = {}): WithGlobalLoading {
    const globalLoader = useContext(GlobalLoaderContext);

    if (!globalLoader) {
        throw new Error('Trying to use uninitialized GlobalLoaderContext');
    }

    const withGlobalLoader = <T>(promise: Promise<T>, options: TaskOptions = defaultTaskOptions) => {
        const [taskPromise] = globalLoader.addPendingTask(promise, options);
        return taskPromise;
    };

    return withGlobalLoader;
}

export default useGlobalLoader;
