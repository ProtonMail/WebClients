import React, { createContext, useReducer, useCallback, useMemo } from 'react';

export interface TaskOptions {
    text?: string;
}

export interface Task {
    promise: Promise<any>;
    options: TaskOptions;
}

type Action = { type: 'addPendingTask'; payload: Task } | { type: 'resolvePendingTask'; payload: Task };

const reducer = (state: Task[], action: Action) => {
    switch (action.type) {
        case 'addPendingTask':
            return [...state, action.payload];
        case 'resolvePendingTask':
            return state.filter((task) => task !== action.payload);
        default:
            return state;
    }
};

const useGlobalLoaderProvider = () => {
    const [tasks, dispatch] = useReducer(reducer, []);

    const addPendingTask = useCallback(<T,>(promise: Promise<T>, options: TaskOptions): [Promise<T>, Task] => {
        const task = { options, promise };
        dispatch({ type: 'addPendingTask', payload: task });
        return [
            promise.finally(() => {
                dispatch({ type: 'resolvePendingTask', payload: task });
            }),
            task,
        ];
    }, []);

    return {
        tasks,
        addPendingTask,
    };
};

export const GlobalLoaderTasksContext = createContext<Task[] | null>(null);
export const GlobalLoaderContext = createContext<{
    addPendingTask: <T>(promise: Promise<T>, options: TaskOptions) => [Promise<T>, Task];
} | null>(null);

interface Props {
    children: React.ReactNode;
}

const GlobalLoaderProvider = ({ children }: Props) => {
    const { addPendingTask, tasks } = useGlobalLoaderProvider();

    const globalLoader = useMemo(() => ({ addPendingTask }), [addPendingTask]);

    return (
        <GlobalLoaderTasksContext.Provider value={tasks}>
            <GlobalLoaderContext.Provider value={globalLoader}>{children}</GlobalLoaderContext.Provider>
        </GlobalLoaderTasksContext.Provider>
    );
};

export default GlobalLoaderProvider;
