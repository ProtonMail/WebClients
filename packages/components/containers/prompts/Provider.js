import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import PromptsContext from '../../context/prompts';
import PromptsContainer from './Container';

const PromptsProvider = ({ children, manager }) => {
    const [prompts, setPrompts] = useState(manager.get());

    useEffect(() => {
        const onChange = (newPrompts) => {
            setPrompts(newPrompts);
        };

        const unsubscribe = manager.subscribe(onChange);

        return () => {
            unsubscribe();
            manager.resetPrompts();
        };
    }, []);

    return (
        <PromptsContext.Provider value={manager}>
            {children}
            <PromptsContainer prompts={prompts} />
        </PromptsContext.Provider>
    );
};

PromptsProvider.propTypes = {
    children: PropTypes.node.isRequired,
    manager: PropTypes.object.isRequired
};
export default PromptsProvider;
