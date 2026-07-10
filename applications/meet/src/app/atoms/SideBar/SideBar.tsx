import { useEffect, useRef } from 'react';

import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import clsx from '@proton/utils/clsx';

import { CloseButton } from '../CloseButton/CloseButton';

import './SideBar.scss';

interface SideBarProps {
    children: React.ReactNode;
    onClose: () => void;
    'aria-label': string;
    header?: React.ReactNode;
    absoluteHeader?: boolean;
    isScrolled?: boolean;
    paddingClassName?: string;
    paddingHeaderClassName?: string;
}

export const SideBar = ({
    children,
    onClose,
    'aria-label': ariaLabel,
    header,
    absoluteHeader = false,
    isScrolled = false,
    paddingClassName = 'px-6 pt-6 pb-4',
    paddingHeaderClassName = '',
}: SideBarProps) => {
    const asideRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    // Trap Tab focus within the open side-bar, focus it on open, and restore
    // focus to the opener on close. `disableRestoreByPointer` is off so focus
    // returns to the opener even when closed via a pointer click.
    const focusTrapProps = useFocusTrap({
        rootRef: asideRef,
        enableInitialFocus: false,
        disableRestoreByPointer: false,
    });

    // Publish the offset from the scroll region's top to the header's bottom so content (e.g. sticky
    // chat thread roots) can align flush beneath the absolute header.
    useEffect(() => {
        const headerEl = headerRef.current;
        const asideEl = asideRef.current;
        if (!headerEl || !asideEl) {
            return;
        }

        const updateHeaderOffset = () => {
            const asideStyle = getComputedStyle(asideEl);
            const borderTop = parseFloat(asideStyle.borderTopWidth) || 0;
            const paddingTop = parseFloat(asideStyle.paddingTop) || 0;
            const contentTop = asideEl.getBoundingClientRect().top + borderTop + paddingTop;
            const offset = Math.max(0, headerEl.getBoundingClientRect().bottom - contentTop);
            asideEl.style.setProperty('--side-bar-header-height', `${offset}px`);
        };

        updateHeaderOffset();

        const observer = new ResizeObserver(updateHeaderOffset);
        observer.observe(headerEl);
        observer.observe(asideEl);

        return () => observer.disconnect();
    }, []);

    return (
        <aside
            ref={asideRef}
            aria-label={ariaLabel}
            className={clsx(
                'meet-side-bar border border-norm flex flex-nowrap flex-column h-full w-full large-meet-radius relative max-w-full z-1',
                paddingClassName
            )}
            {...focusTrapProps}
        >
            <div
                ref={headerRef}
                className={clsx(
                    'side-bar-header-wrapper flex items-center justify-space-between w-full flex-nowrap',
                    absoluteHeader && 'absolute top-0 left-0 px-6 pt-6 side-bar-transparent-header',
                    isScrolled && 'scrolled',
                    !!header && 'pb-4',
                    paddingHeaderClassName
                )}
            >
                {header}

                <div className={clsx(header ? '' : 'ml-auto', 'shrink-0')}>
                    <CloseButton onClose={onClose} />
                </div>
            </div>

            {children}
        </aside>
    );
};
