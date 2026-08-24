import { useSelector } from 'react-redux';

import { selectAutofillModelExperimentGroup } from '../store/selectors';
import type { AutofillModelExperimentGroup } from '../types/api/features';

export const useAutofillModelExperimentGroup = (): AutofillModelExperimentGroup =>
    useSelector(selectAutofillModelExperimentGroup);
