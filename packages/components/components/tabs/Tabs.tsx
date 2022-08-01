import { ReactNode } from 'react';

import { classnames } from '../../helpers';
import { Tab } from './index.d';
import { useIndicator } from './useIndicator';

const toKey = (index: number, prefix = '') => `${prefix}${index}`;

interface Props {
    tabs?: Tab[];
    gap?: ReactNode;
    children?: Tab[];
    value: number;
    onChange: (index: number) => void;
    stickyTabs?: boolean;
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
    stickyTabs,
    fullWidth,
    className,
    containerClassName,
    navContainerClassName,
    contentClassName,
}: Props) => {
    const key = toKey(value, 'key_');
    const label = toKey(value, 'label_');
    const tabList = tabs || children || [];
    const content = tabList[value]?.content;

    const { ref: containerRef, scale, translate } = useIndicator(tabList, value);

    if (tabs?.length === 1) {
        return <>{content}</>;
    }

    return (
        <div className={classnames(['tabs', className])}>
            <div className={classnames([navContainerClassName])}>
                <nav
                    className={classnames([
                        'tabs-container border-bottom border-weak',
                        stickyTabs && 'sticky-top bg-norm',
                        containerClassName,
                    ])}
                >
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
                            return (
                                <li key={key} className="tabs-list-item" role="presentation">
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
                                        aria-selected={value === index}
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
