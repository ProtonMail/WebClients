import React, { useState } from 'react';
import { useIndicator } from './useIndicator';
import { classnames } from '../../helpers/component';
import { Tab } from './index';

const toKey = (index: number, prefix = '') => `${prefix}${index}`;

interface Props {
    tabs: Tab[];
    preselectedTab?: number;
    fullWidth?: boolean;
}

const Tabs = ({ tabs = [], preselectedTab = 0, fullWidth }: Props) => {
    const [selectedTab, updateSelectedTab] = useState(preselectedTab);
    const key = toKey(selectedTab, 'key_');
    const label = toKey(selectedTab, 'label_');
    const { content } = tabs[selectedTab];

    const { ref: containerRef, scale, translate } = useIndicator(tabs, selectedTab);

    return (
        <div className={classnames(['tabs', fullWidth && 'tabs--extended'])}>
            <nav className="tabs-container">
                <ul
                    className="tabs-list"
                    role="tablist"
                    ref={containerRef}
                    style={{ '--translate': translate, '--scale': scale }}
                >
                    {tabs.map(({ title }, index) => {
                        const key = toKey(index, 'key_');
                        const label = toKey(index, 'label_');
                        return (
                            <li key={key} className="tabs-list-item" role="presentation">
                                <button
                                    onClick={(event) => {
                                        event.preventDefault();
                                        updateSelectedTab(index);
                                    }}
                                    className="tabs-list-link"
                                    id={label}
                                    role="tab"
                                    aria-controls={key}
                                    tabIndex={0}
                                    aria-selected={selectedTab === index}
                                >
                                    {title}
                                </button>
                            </li>
                        );
                    })}
                    <li className="tabs-indicator" aria-hidden />
                </ul>
            </nav>
            <div id={key} className="tabs-tabcontent pt1 pb1" role="tabpanel" aria-labelledby={label}>
                {content}
            </div>
        </div>
    );
};

export default Tabs;
