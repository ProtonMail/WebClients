const pendingTasks = new Set();

const unloadCallback = (e: BeforeUnloadEvent) => {
    if (pendingTasks.size) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
};

window.addEventListener('beforeunload', unloadCallback);

function usePreventLeave() {
    const preventLeave = <T>(task: Promise<T>) => {
        pendingTasks.add(task);
        const cleanup = () => pendingTasks.delete(task);
        task.then(cleanup).catch(cleanup);
        return task;
    };

    return { preventLeave };
}

export default usePreventLeave;
