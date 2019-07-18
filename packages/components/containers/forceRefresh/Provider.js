import React, { useState, useCallback, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import Context from './context';

const ForceRefreshProvider = React.forwardRef(({ children }, ref) => {
    const [state, setState] = useState(1);

    const refresh = useCallback(() => setState((i) => i + 1), []);

    useImperativeHandle(ref, () => refresh);

    return (
        <Context.Provider value={refresh} key={state}>
            {children}
        </Context.Provider>
    );
});

ForceRefreshProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default ForceRefreshProvider;
