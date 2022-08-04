import { ReactNode, useEffect, useRef, useState } from 'react';

import { equivalentReducer } from '@proton/components/hooks/useElementRect';
import debounce from '@proton/utils/debounce';

import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import { classnames } from '../../helpers';
import { Tab } from './index.d';

const toKey = (index: number, prefix = '') => `${prefix}${index}`;

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
}

export const Tabs = ({
    value,
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
}: Props) => {
    const key = toKey(value, 'key_');
    const label = toKey(value, 'label_');
    const tabList = tabs || children || [];
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
            debouncedHandleResize.abort();
            window.removeEventListener('resize', debouncedHandleResize);
            resizeObserver.disconnect();
        };
        // tabs.title.join is meant to cover if the tabs would dynamically change
    }, [containerRef.current, selectedTabEl, tabs?.map((tab) => tab.title).join('')]);

    if (tabs?.length === 1) {
        return <>{content}</>;
    }

    return (
        <div className={classnames(['tabs', className])}>
            <div className={classnames([navContainerClassName, stickyTabs && 'sticky-top bg-norm'])}>
                <nav className={classnames(['tabs-container border-bottom border-weak', containerClassName])}>
                    <ul
                        className={classnames([
                            'tabs-list unstyled flex relative m0 p0',
                            fullWidth && 'tabs-list--fullWidth',
                        ])}
                        role="tablist"
                        ref={containerRef}
                        style={{ '--translate': translate, '--scale': scale }}
                    >
                        {tabList.map(({ title }, index) => {
                            const key = toKey(index, 'key_');
                            const label = toKey(index, 'label_');
                            const selected = value === index;
                            return (
                                <li
                                    key={key}
                                    className="tabs-list-item"
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
                                        className="tabs-list-link flex flex-justify-center relative text-semibold"
                                        id={label}
                                        role="tab"
                                        aria-controls={key}
                                        tabIndex={0}
                                        aria-selected={selected}
                                        data-testid={`tab-header-${title}-button`}
                                    >
                                        {title}
                                    </button>
                                </li>
                            );
                        })}
                        <li className="tabs-indicator" aria-hidden />
                    </ul>
                </nav>
            </div>
            {gap}
            <div
                id={key}
                className={classnames(['tabs-tabcontent pt1', contentClassName])}
                role="tabpanel"
                aria-labelledby={label}
            >
                {content}
            </div>
        </div>
    );
};

export default Tabs;
