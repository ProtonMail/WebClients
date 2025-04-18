import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { type IconName } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import { useRightToLeft } from '@proton/components/containers/rightToLeft/useRightToLeft';
import { equivalentReducer } from '@proton/components/hooks/useElementRect';
import clamp from '@proton/utils/clamp';
import clsx from '@proton/utils/clsx';
import debounce from '@proton/utils/debounce';

import './Tabs.scss';

const toKey = (index: number, prefix = '') => `${prefix}${index}`;

export type Tab = {
    title: string;
    content?: ReactNode;
    icon?: IconName;
    iconPosition?: 'leading' | 'trailing';
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
    /**
     * Tabs container will only take as much width as needed
     */
    contained?: boolean;
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
    contained = false,
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
    const width = `${selectedTabRect?.width || 0}px`;
    const offset = (isRTL ? -1 : 1) * Math.abs((selectedTabRect?.x || 0) - (containerTabRect?.x || 0));
    const translate = `${offset}px`;

    useEffect(() => {
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
            <div className={clsx(['tabs-nav', navContainerClassName, stickyTabs && 'sticky top-0 bg-norm'])}>
                <nav
                    className={clsx([
                        'tabs-container',
                        variant === 'underline' && 'border-bottom border-weak',
                        !!contained && 'inline-flex',
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
                        style={{ '--translate': translate, '--scale': scale, '--width': width }}
                    >
                        {tabList.map(({ title, icon, iconPosition = 'trailing' }, index) => {
                            const key = toKey(index, 'key_');
                            const label = toKey(index, 'label_');
                            const selected = value === index;

                            return (
                                /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
                                <li
                                    key={key}
                                    className={clsx(
                                        'tabs-list-item',
                                        selected && 'tabs-list-item--selected',
                                        !selected && 'color-weak hover:color-norm',
                                        variant === 'underline' && 'text-semibold',
                                        variant === 'underline' && selected && 'color-norm',
                                        variant === 'modern' && selected && 'text-semibold color-norm'
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
                                        className={clsx(
                                            'tabs-list-link flex flex-nowrap justify-center items-center gap-1 relative interactive--no-background',
                                            variant === 'underline' && 'interactive-pseudo-inset',
                                            variant === 'modern' && 'interactive-pseudo rounded'
                                        )}
                                        id={label}
                                        role="tab"
                                        aria-controls={key}
                                        tabIndex={0}
                                        aria-selected={selected}
                                        data-testid={`tab-header-${title.replace(/\s+/, '-').toLowerCase()}-button`}
                                    >
                                        {icon && iconPosition === 'leading' && (
                                            <Icon name={icon} className="shrink-0" />
                                        )}
                                        <span
                                            className={clsx(
                                                (variant === 'modern' || icon) && 'text-ellipsis flex flex-column'
                                            )}
                                            data-title={title}
                                        >
                                            {title}
                                        </span>
                                        {icon && iconPosition === 'trailing' && (
                                            <Icon name={icon} className="shrink-0" />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                        <li className="tabs-indicator" aria-hidden="true" />
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
