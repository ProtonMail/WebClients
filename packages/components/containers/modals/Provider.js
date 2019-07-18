import React, { useRef, useState, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import ModalsContext from './modalsContext';
import ModalsChildrenContext from './childrenContext';
import createManager from './manager';

const ModalsProvider = React.forwardRef(({ children }, ref) => {
    const [modals, setModals] = useState([]);
    const managerRef = useRef();

    if (!managerRef.current) {
        managerRef.current = createManager(setModals);
    }

    const manager = managerRef.current;

    useImperativeHandle(ref, () => manager);

    return (
        <ModalsContext.Provider value={manager}>
            <ModalsChildrenContext.Provider value={modals}>{children}</ModalsChildrenContext.Provider>
        </ModalsContext.Provider>
    );
});

ModalsProvider.propTypes = {
    children: PropTypes.node.isRequired
};
export default ModalsProvider;
