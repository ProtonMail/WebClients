import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

import ModalsContext from './modalsContext';
import ModalsChildrenContext from './childrenContext';
import createManager from './manager';

const ModalsProvider = ({ children }) => {
    const [modals, setModals] = useState([]);

    const manager = useMemo(() => {
        return createManager(modals, setModals);
    }, [modals, setModals]);

    return (
        <ModalsContext.Provider value={manager}>
            <ModalsChildrenContext.Provider value={modals}>{children}</ModalsChildrenContext.Provider>
        </ModalsContext.Provider>
    );
};

ModalsProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ModalsProvider;
