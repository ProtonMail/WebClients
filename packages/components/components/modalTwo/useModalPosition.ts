import { useLayoutEffect, useState } from 'react';
import { last, remove } from '@proton/shared/lib/helpers/array';

import { useInstance } from '../../hooks';

let id = 0;
let backdropIds: string[] = [];
const subscribers: { [id: string]: (() => void)[] } = {};

const notify = () => {
    Object.values(subscribers)
        .flat()
        .forEach((subscriber) => subscriber());
};

const register = (id: string) => {
    backdropIds.push(id);
    notify();
    return {
        unregister() {
            backdropIds = remove(backdropIds, id);
            delete subscribers[id];
            notify();
        },

        subscribe(fn: () => void) {
            subscribers[id] = [...(subscribers[id] || []), fn];
        },

        isFirst() {
            const [first] = backdropIds;
            return first === id;
        },

        isLast() {
            return last(backdropIds) === id;
        },
    };
};

const useModalPosition = (open: boolean) => {
    const internalId = useInstance(() => String(id++));

    const [first, setFirst] = useState<boolean>();
    const [last, setLast] = useState<boolean>();

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        const { subscribe, unregister, isFirst, isLast } = register(internalId);

        const sync = () => {
            setFirst(isFirst());
            setLast(isLast());
        };

        subscribe(sync);

        sync();

        return () => {
            unregister();
        };
    }, [open]);

    return { first, last };
};

export default useModalPosition;
