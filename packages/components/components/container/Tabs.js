import React from 'react';
import PropTypes from 'prop-types';

const toKey = (index, prefix = '') => `${prefix}${index}`;

const Tabs = ({ tabs = [], selectedTab, updateSelectedTab }) => {
    const key = toKey(selectedTab, 'key_');
    const label = toKey(selectedTab, 'label_');
    const { content } = tabs[selectedTab];

    return (
        <div className="tabs-container">
            <ul className="tabs-list" role="tablist">
                {tabs.map(({ title }, index) => {
                    const key = toKey(index, 'key_');
                    const label = toKey(index, 'label_');
                    return (
                        <li key={key} className="tabs-list-item" role="presentation">
                            <a
                                onClick={() => updateSelectedTab(index)}
                                className="tabs-list-link"
                                id={label}
                                role="tab"
                                aria-controls={key}
                                tabIndex="0"
                                aria-selected={selectedTab === index}
                            >
                                {title}
                            </a>
                        </li>
                    );
                })}
            </ul>
            <div id={key} className="tabs-tabcontent pt1" role="tabpanel" aria-labelledby={label}>
                {content}
            </div>
        </div>
    );
};

Tabs.propTypes = {
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.node,
            content: PropTypes.node
        })
    ),
    selectedTab: PropTypes.number,
    updateSelectedTab: PropTypes.func
};

export default Tabs;
