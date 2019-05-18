import React, { useRef, useState, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import ModalsContext from '../../context/modals';
import ModalsContainer from './Container';
import createManager from './manager';

const ModalsProvider = React.forwardRef(({ children }, ref) => {
    const [modals, setModals] = useState([]);
    const managerRef = useRef();

    if (!managerRef.current) {
        managerRef.current = createManager(setModals);
    }

    const manager = managerRef.current;

    useImperativeHandle(ref, () => manager);

    const { removeModal, hideModal } = manager;

    return (
        <ModalsContext.Provider value={manager}>
            {children}
            <ModalsContainer modals={modals} removeModal={removeModal} hideModal={hideModal} />
        </ModalsContext.Provider>
    );
});

ModalsProvider.propTypes = {
    children: PropTypes.node.isRequired
};
export default ModalsProvider;
