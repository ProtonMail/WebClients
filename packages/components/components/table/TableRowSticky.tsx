import React, { useEffect, useState } from 'react';
import { classnames } from '../../helpers/component';

interface Props<T> extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement> {
    scrollAreaRef: React.RefObject<T>;
    children: React.ReactNode;
}

function TableRowSticky<T extends HTMLElement>({ children, scrollAreaRef, className, ...rest }: Props<T>) {
    const [isScrollTop, setScrollTop] = useState(true);

    useEffect(() => {
        const el = scrollAreaRef.current;

        if (!el) {
            return;
        }

        const onScroll = () => {
            const isTopReached = el.scrollTop === 0;

            if (isTopReached !== isScrollTop) {
                setScrollTop(isTopReached);
            }
        };

        onScroll();

        el.addEventListener('scroll', onScroll);
        return () => {
            el.removeEventListener('scroll', onScroll);
        };
    }, [scrollAreaRef.current, isScrollTop]);

    return (
        <tr
            {...rest}
            className={classnames([
                'pm-simple-table-stickyRow',
                isScrollTop && 'pm-simple-table-stickyRow--isOnTop',
                className,
            ])}
        >
            {children}
        </tr>
    );
}

export default TableRowSticky;
