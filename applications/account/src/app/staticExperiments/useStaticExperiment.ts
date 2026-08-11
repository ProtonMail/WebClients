import { baseUseSelector } from '@proton/react-redux-store';

import { selectStaticExperiments } from './slice';
import type { StaticExperimentName, StaticExperimentVariant } from './types';

export const useStaticExperiment = <Name extends StaticExperimentName>(name: Name): StaticExperimentVariant<Name> => {
    const variant = baseUseSelector(selectStaticExperiments)?.[name];
    if (!variant) {
        throw new Error(`Static experiment "${name}" was read before it was resolved`);
    }
    return variant as StaticExperimentVariant<Name>;
};
