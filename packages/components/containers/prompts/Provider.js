import React, { useReducer, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import PromptsContext from '../../context/prompts';
import PromptsContainer from './Container';
import reducer from './reducer';
import createManager from './manager';

const PromptsProvider = ({ children }) => {
    const [prompts, dispatch] = useReducer(reducer, []);

    // Using useState as a instance variable rather than useMemo because it can be cleared by react
    const [manager] = useState(() => createManager(dispatch));

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
