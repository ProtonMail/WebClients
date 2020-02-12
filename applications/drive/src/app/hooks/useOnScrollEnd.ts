import { useEffect, MutableRefObject } from 'react';
import { useElementRect } from 'react-components';

const isScrollEnd = (target: HTMLElement | null, offsetRatio: number) =>
    target && target.scrollHeight - target.scrollTop <= target.clientHeight / offsetRatio;

function useOnScrollEnd(callback: () => void, targetRef: MutableRefObject<HTMLElement | null>, offsetRatio = 1) {
    const boundingBox = useElementRect(targetRef);

    useEffect(() => {
        const handleScroll = ({ target }: Event) => {
            if (isScrollEnd(target as HTMLElement | null, offsetRatio)) {
                callback();
            }
        };

        // If initially at the end or no scrollbar execute callback
        if (isScrollEnd(targetRef.current, offsetRatio)) {
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
