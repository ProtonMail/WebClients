import { useEffect, useRef } from 'react';

/** Calls send once per mount, as soon as ready is true. */
export const useSendOnce = (send: () => void, ready = true) => {
    const sentRef = useRef(false);

    useEffect(() => {
        if (ready && !sentRef.current) {
            sentRef.current = true;
            send();
        }
    });
};
