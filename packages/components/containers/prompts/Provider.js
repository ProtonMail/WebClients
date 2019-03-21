import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';

import PromptsContext from '../../context/prompts';
import useInstance from '../../hooks/useInstance';
import PromptsContainer from './Container';
import reducer from './reducer';
import createManager from './manager';

const PromptsProvider = ({ children }) => {
    const [prompts, dispatch] = useReducer(reducer, []);
    const manager = useInstance(() => createManager(dispatch));

    useEffect(() => {
        return () => manager.resetPrompts();
    }, []);

    return (
        <PromptsContext.Provider value={manager}>
            {children}
            <PromptsContainer prompts={prompts} />
        </PromptsContext.Provider>
    );
};

PromptsProvider.propTypes = {
    children: PropTypes.node.isRequired
};
export default PromptsProvider;
