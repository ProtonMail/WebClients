import React, { useState } from 'react';
import PropTypes from 'prop-types';

import Tabs from './Tabs';

const SimpleTabs = ({ tabs = [], initialTabSelected = 0 }) => {
    const [selectedTab, updateSelectedTab] = useState(initialTabSelected);
    return <Tabs tabs={tabs} selectedTab={selectedTab} updateSelectedTab={updateSelectedTab} />;
};

SimpleTabs.propTypes = {
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            title: PropTypes.string,
            content: PropTypes.node
        })
    ),
    initialTabSelected: PropTypes.number
};

export default SimpleTabs;
