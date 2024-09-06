import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { equivalentReducer } from '@proton/components/hooks/useElementRect';
import clamp from '@proton/utils/clamp';
import clsx from '@proton/utils/clsx';
import debounce from '@proton/utils/debounce';

import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import type { IconName } from '../icon';
import { Icon } from '../icon';

import './Tabs.scss';

const toKey = (index: number, prefix = '') => `${prefix}${index}`;

export type Tab = {
    title: string;
    content?: ReactNode;
    icon?: IconName;
};

interface Props {
    tabs?: Tab[];
    gap?: ReactNode;
    children?: Tab[];
    value: number;
    onChange: (index: number) => void;
    /**
     * Will make tabs stick to the top of the container when overflowing
     */
    stickyTabs?: boolean;
    /**
     * Tabs will take the maximum width and divide equally
     */
    fullWidth?: boolean;
    className?: string;
    containerClassName?: string;
    navContainerClassName?: string;
    contentClassName?: string;
    variant?: 'underline' | 'modern';
}

export const Tabs = ({
    value: unsafeValue,
    onChange,
    tabs,
    gap,
    children,
    stickyTabs = false,
    fullWidth = false,
    className,
    containerClassName,
    navContainerClassName,
    contentClassName,
    variant = 'underline',
}: Props) => {
    const tabList = tabs || children || [];
    const value = clamp(unsafeValue, 0, tabList.length - 1);
    const content = tabList[value]?.content;
    const containerRef = useRef<HTMLUListElement>(null);
    const [selectedTabEl, setSelectedTabEl] = useState<HTMLLIElement | null>(null);
    const [selectedTabRect, setSelectedTabRect] = useState<DOMRect | undefined>(undefined);
    const [containerTabRect, setContainerTabRect] = useState<DOMRect | undefined>(undefined);
    const [isRTL] = useRightToLeft();

    const scale = (selectedTabRect?.width || 0) / (containerTabRect?.width || 1);
    const offset = (isRTL ? -1 : 1) * Math.abs((selectedTabRect?.x || 0) - (containerTabRect?.x || 0));
    const translate = `${offset}px`;

    useEffect(() => {
        if (variant !== 'underline') {
            return;
        }

        const containerTabEl = containerRef.current;
        if (!containerTabEl || !selectedTabEl) {
            return;
        }
        const handleResize = () => {
            const selectedTabRect = selectedTabEl.getBoundingClientRect();
            const containerTabRect = containerTabEl.getBoundingClientRect();
            setSelectedTabRect((old) => equivalentReducer(old, selectedTabRect));
            setContainerTabRect((old) => equivalentReducer(old, containerTabRect));
        };
        const debouncedHandleResize = debounce(handleResize, 100);
        const resizeObserver = new ResizeObserver(debouncedHandleResize);
        resizeObserver.observe(containerTabEl, { box: 'border-box' });
        resizeObserver.observe(selectedTabEl, { box: 'border-box' });
        // Resize event listener is meant to update for if the left coordinate changes (without size changing)
        window.addEventListener('resize', debouncedHandleResize);
        handleResize();
        return () => {
            debouncedHandleResize.cancel();
            window.removeEventListener('resize', debouncedHandleResize);
            resizeObserver.disconnect();
        };
        // tabs.title.join is meant to cover if the tabs would dynamically change
    }, [variant, containerRef.current, selectedTabEl, tabs?.map((tab) => tab.title).join('')]);

    if (tabs?.length === 1) {
        return (
            <>
                {gap}
                {content}
            </>
        );
    }

    if (!tabs?.length) {
        return null;
    }

    const key = toKey(value, 'key_');
    const label = toKey(value, 'label_');

    return (
        <div className={clsx(['tabs', 'tabs--' + variant, className])}>
            <div className={clsx([navContainerClassName, stickyTabs && 'sticky top-0 bg-norm'])}>
                <nav
                    className={clsx([
                        'tabs-container',
                        variant === 'underline' && 'border-bottom border-weak',
                        containerClassName,
                    ])}
                >
                    <ul
                        className={clsx([
                            'tabs-list unstyled flex flex-nowrap relative m-0 p-0',
                            fullWidth && 'tabs-list--fullWidth',
                            'items-end',
                        ])}
                        role="tablist"
                        ref={containerRef}
                        style={{ '--translate': translate, '--scale': scale }}
                    >
                        {tabList.map(({ title, icon }, index) => {
                            const key = toKey(index, 'key_');
                            const label = toKey(index, 'label_');
                            const selected = value === index;

                            return (
                                /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
                                <li
                                    key={key}
                                    className={clsx(
                                        'tabs-list-item',
                                        variant === 'underline' && 'text-semibold hover:color-norm',
                                        variant === 'underline' && !selected && 'color-weak',
                                        variant === 'underline' && selected && 'color-norm',
                                        variant === 'modern' && 'text-lg color-primary',
                                        variant === 'modern' && selected && 'text-semibold'
                                    )}
                                    role="presentation"
                                    ref={selected ? setSelectedTabEl : undefined}
                                >
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            onChange(index);
                                        }}
                                        type="button"
                                        className="tabs-list-link flex flex-nowrap justify-center items-center gap-1 relative"
                                        id={label}
                                        role="tab"
                                        aria-controls={key}
                                        tabIndex={0}
                                        aria-selected={selected}
                                        data-testid={`tab-header-${title.replace(/\s+/, '-').toLowerCase()}-button`}
                                    >
                                        <span className={clsx((variant === 'modern' || icon) && 'text-ellipsis block')}>
                                            {title}
                                        </span>
                                        {icon && <Icon name={icon} className="shrink-0" />}
                                    </button>
                                </li>
                            );
                        })}
                        {variant === 'underline' && <li className="tabs-indicator" aria-hidden />}
                    </ul>
                </nav>
            </div>
            {gap}
            <div
                id={key}
                className={clsx('tabs-tabcontent', content ? 'pt-4' : '', contentClassName)}
                role="tabpanel"
                aria-labelledby={label}
            >
                {content}
            </div>
        </div>
    );
};

export default Tabs;
