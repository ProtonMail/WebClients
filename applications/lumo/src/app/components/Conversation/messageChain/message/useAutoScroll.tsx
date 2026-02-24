import type React from 'react';
import { useEffect, useState } from 'react';

const useAutoScroll = (ref: React.MutableRefObject<HTMLDivElement | null>, isRunning: boolean, dependencies: any) => {
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (!ref.current) {
                return;
            }

            const { scrollTop, scrollHeight, clientHeight } = ref.current;

            if (scrollHeight - scrollTop - clientHeight > 50) {
                setIsAutoScrollEnabled(false);
            }
        };

        const chainRef = ref.current;
        if (chainRef) {
            chainRef.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (chainRef) {
                chainRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, dependencies);

    useEffect(() => {
        if (isRunning && isAutoScrollEnabled && ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [isRunning, isAutoScrollEnabled, ...dependencies]);

    return [isAutoScrollEnabled, setIsAutoScrollEnabled];
};

export default useAutoScroll;
