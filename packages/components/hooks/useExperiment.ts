import { useContext, useEffect } from 'react';

import ExperimentsContext, { ExperimentCode } from '../containers/experiments/ExperimentsContext';
import { DEFAULT_EXPERIMENT_VALUE } from '../containers/experiments/ExperimentsProvider';

const useExperiment = (code: ExperimentCode, trigger = true) => {
    const { experiments, loading, initialize } = useContext(ExperimentsContext);

    useEffect(() => {
        if (trigger) {
            void initialize();
        }
    }, [trigger]);

    return {
        value: experiments[code] || DEFAULT_EXPERIMENT_VALUE,
        loading: !!loading,
    };
};

export default useExperiment;
