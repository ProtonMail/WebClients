import { useContext } from 'react';

import { Loader } from '../loader';
import { GlobalLoaderTasksContext } from './GlobalLoaderProvider';

const GlobalLoader = () => {
    const [task] = useContext(GlobalLoaderTasksContext) || [];

    if (!task) {
        return null;
    }

    const { text } = task.options;

    return (
        <div
            className="fixed flex absolute-center-x bg-norm color-weak p-2 rounded top-custom global-loader"
            style={{ '--top-custom': '1.5em' }}
        >
            <Loader size="small" className="flex" />
            {text && <span className="ml-2">{text}</span>}
        </div>
    );
};

export default GlobalLoader;
