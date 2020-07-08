import React from 'react';
import { useIndicator } from './useIndicator';
import { Tab } from './index';

const toKey = (index: number, prefix = '') => `${prefix}${index}`;

interface Props {
    tabs?: Tab[];
    children?: Tab[];
    value: number;
    onChange: (index: number) => void;
}

export const Tabs = ({ value, onChange, tabs, children }: Props) => {
    const key = toKey(value, 'key_');
    const label = toKey(value, 'label_');
    const tabList = tabs || children || [];
    const content = tabList[value]?.content;

    const { ref: containerRef, scale, translate } = useIndicator(tabList, value);

    return (
        <div className="tabs">
            <nav className="tabs-container">
                <ul
                    className="tabs-list"
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
                                        event.preventDefault();
                                        onChange(index);
                                    }}
                                    className="tabs-list-link"
                                    id={label}
                                    role="tab"
                                    aria-controls={key}
                                    tabIndex={0}
                                    aria-selected={value === index}
                                >
                                    {title}
                                </button>
                            </li>
                        );
                    })}
                    <li className="tabs-indicator" aria-hidden />
                </ul>
            </nav>
            <div id={key} className="tabs-tabcontent pt1" role="tabpanel" aria-labelledby={label}>
                {content}
            </div>
        </div>
    );
};

export default Tabs;
