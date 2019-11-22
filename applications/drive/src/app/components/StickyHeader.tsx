import React, { useState, useEffect } from 'react';
import { useMainArea, classnames } from 'react-components';

interface Props {
    children: React.ReactNode;
}

const StickyHeader = ({ children }: Props) => {
    const mainAreaRef = useMainArea();
    const [topClass, setClass] = useState('sticky-title--onTop');

    useEffect(() => {
        if (!mainAreaRef.current) {
            return;
        }

        const el = mainAreaRef.current;

        const onScroll = () => {
            setClass(el.scrollTop ? '' : 'sticky-title--onTop');
        };

        onScroll();

        el.addEventListener('scroll', onScroll);
        return () => {
            el.removeEventListener('scroll', onScroll);
        };
    }, [mainAreaRef.current]);

    return (
        <div className={classnames(['sticky-title', topClass])}>
            <div className="pl0-75 pt0-5 pb0-5 pr0-75">{children}</div>
        </div>
    );
};

export default StickyHeader;
