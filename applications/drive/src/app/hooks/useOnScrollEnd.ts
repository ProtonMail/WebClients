import { useEffect, MutableRefObject } from 'react';
import { useElementRect } from 'react-components';

const isScrollEnd = (target: HTMLElement | null) =>
    target && target.scrollHeight - target.scrollTop === target.clientHeight;

function useOnScrollEnd(callback: () => void, targetRef: MutableRefObject<HTMLElement | null>) {
    const boundingBox = useElementRect(targetRef);

    useEffect(() => {
        const handleScroll = ({ target }: Event) => {
            if (isScrollEnd(target as HTMLElement | null)) {
                callback();
            }
        };

        // If initially at the end or no scrollbar execute callback
        if (isScrollEnd(targetRef.current)) {
            callback();
        }

        if (targetRef.current) {
            targetRef.current.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (targetRef.current) {
                targetRef.current.removeEventListener('scroll', handleScroll);
            }
        };
    }, [targetRef.current, callback, boundingBox]);
}

export default useOnScrollEnd;
