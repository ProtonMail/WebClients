import { useEffect, MutableRefObject } from 'react';

const useEventListener = (
    ref: MutableRefObject<Element | null | undefined>,
    eventName: string,
    handler: EventListenerOrEventListenerObject
) => {
    useEffect(() => {
        ref.current?.addEventListener(eventName, handler);
        return () => ref.current?.removeEventListener(eventName, handler);
    }, [ref.current, handler]);
};

export default useEventListener;
