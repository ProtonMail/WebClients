import { DetailedHTMLProps, HTMLAttributes, ReactNode, RefObject, useEffect, useState } from 'react';
import { classnames } from '../../helpers';

interface Props<T> extends DetailedHTMLProps<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement> {
    scrollAreaRef: RefObject<T>;
    children: ReactNode;
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
                'simple-table-sticky-row',
                isScrollTop && 'simple-table-sticky-row--is-on-top',
                className,
            ])}
        >
            {children}
        </tr>
    );
}

export default TableRowSticky;
