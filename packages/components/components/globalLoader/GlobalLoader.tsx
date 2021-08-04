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
            className="fixed flex centered-absolute-horizontal bg-norm color-weak p0-5 rounded"
            style={{ top: '1.5em' }}
        >
            <Loader size="small" className="flex" />
            {text && <span className="ml0-5">{text}</span>}
        </div>
    );
};

export default GlobalLoader;
