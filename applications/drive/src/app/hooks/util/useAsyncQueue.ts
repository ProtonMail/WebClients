import React from 'react';

export default function useAsyncQueue<T>(parallelCallLimit: number) {
    const queue = React.useRef<(() => Promise<T>)[]>([]);
    const currentLoad = React.useRef<number>(0);

    const run = () => {
        if (queue.current.length === 0 || currentLoad.current >= parallelCallLimit) {
            return;
        }

        currentLoad.current += 1;
        const nextItem = queue.current.shift();

        nextItem!()
            .catch((e: Error) => {
                console.warn(e);
            })
            .finally(() => {
                currentLoad.current -= 1;
                run();
            });
    };

    const addToQueue = (item: () => Promise<T>) => {
        queue.current.push(item);
        run();
    };

    const clearQueue = () => {
        queue.current = [];
    };

    return {
        addToQueue,
        clearQueue,
    };
}
