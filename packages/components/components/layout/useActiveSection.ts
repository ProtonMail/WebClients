import { useState, useEffect } from 'react';
import 'intersection-observer';

const useActiveSection = (setActiveSection: (section: string) => void) => {
    const [observer, setObserver] = useState<IntersectionObserver | undefined>();

    useEffect(() => {
        if (!setActiveSection) {
            return;
        }

        const map: { [key: string]: number } = {};
        const keys: string[] = [];

        const handleIntersect = (elements: IntersectionObserverEntry[]) => {
            elements.forEach((element) => {
                const { target, intersectionRatio } = element;
                if (!(target instanceof HTMLElement)) {
                    return;
                }
                const id = target.dataset.targetId;
                if (!id) {
                    return;
                }
                if (!map[id]) {
                    keys.push(id);
                }
                map[id] = intersectionRatio;
            });

            const { id } = keys.reduce<{ value: number; id: string }>(
                (cur, id) => {
                    const otherValue = map[id];
                    if (otherValue > cur.value) {
                        return { value: otherValue, id };
                    }
                    return cur;
                },
                { value: map[keys[0]], id: keys[0] }
            );

            setActiveSection(id);
        };

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: [0.5, 0.99],
            /*
                A 0.5 threshold takes care of observing changes in big sections, while the 0.99 takes care of small sections.
                Using 0.99 instead of 1 should help in case intersectionRatio doesn't fully reach 1, which has been observed to happen
            */
        };

        const observer = new IntersectionObserver(handleIntersect, options);
        setObserver(observer);
        return () => {
            observer.disconnect();
        };
    }, [setActiveSection]);

    return observer;
};

export default useActiveSection;
