import React from 'react';

import ExperimentsContext from '@proton/components/containers/experiments/ExperimentsContext';

interface Props {
    children: React.ReactNode;
}

/**
 * It's a duplicate of the original ExperimentsProvider for testing purpose
 * We want the experiments to always be "A" and loaded
 */
const ExperimentsTestProvider = ({ children }: Props) => {
    return (
        <ExperimentsContext.Provider value={{ experiments: {}, loading: false, initialize: jest.fn() }}>
            {children}
        </ExperimentsContext.Provider>
    );
};

export default ExperimentsTestProvider;
