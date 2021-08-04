import { useEffect, useContext, useCallback, useState, useRef } from 'react';
import * as React from 'react';

const PreventLeaveContext = React.createContext<{
    clearPendingTasks: () => void;
    preventLeave: <T>(task: Promise<T>) => Promise<T>;
} | null>(null);

export default function usePreventLeave() {
    const preventLeaveState = useContext(PreventLeaveContext);

    if (!preventLeaveState) {
        throw new Error('PreventLeaveContext is not initialized, wrap the app with PreventLeaveProvider');
    }

    return preventLeaveState;
}

export const PreventLeaveProvider = ({ children }: { children: React.ReactNode }) => {
    const pendingTasks = useRef(new Set<Promise<any>>());
    const [hasPendingTasks, setHasPendingTasks] = useState(false);

    const clearPendingTasks = useCallback(() => {
        pendingTasks.current.clear();
    }, []);

    const preventLeave = useCallback(
        <T,>(task: Promise<T>) => {
            pendingTasks.current.add(task);

            if (!hasPendingTasks) {
                setHasPendingTasks(true);
            }

            const cleanup = () => {
                pendingTasks.current.delete(task);

                if (!pendingTasks.current.size) {
                    setHasPendingTasks(false);
                }
            };

            task.then(cleanup).catch(cleanup);
            return task;
        },
        [hasPendingTasks]
    );

    useEffect(() => {
        if (!hasPendingTasks) {
            return;
        }
        const unloadCallback = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };
        window.addEventListener('beforeunload', unloadCallback);
        return () => {
            window.removeEventListener('beforeunload', unloadCallback);
        };
    }, [hasPendingTasks]);

    useEffect(() => {
        return () => clearPendingTasks();
    }, []);

    return (
        <PreventLeaveContext.Provider value={{ preventLeave, clearPendingTasks }}>
            {children}
        </PreventLeaveContext.Provider>
    );
};
