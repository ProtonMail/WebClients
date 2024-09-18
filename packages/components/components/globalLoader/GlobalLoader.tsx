import { useContext } from 'react';

import Loader from '@proton/components/components/loader/Loader';

import { GlobalLoaderTasksContext } from './GlobalLoaderProvider';

const GlobalLoader = () => {
    const [task] = useContext(GlobalLoaderTasksContext) || [];

    if (!task) {
        return null;
    }

    const { text } = task.options;

    return (
        <div
            className="fixed flex inset-x-center bg-norm color-weak p-2 rounded top-custom global-loader"
            style={{ '--top-custom': '1.5em' }}
        >
            <Loader size="small" className="flex" />
            {text && <span className="ml-2">{text}</span>}
        </div>
    );
};

export default GlobalLoader;
