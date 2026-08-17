import { useSelector } from 'react-redux';

import { selectAutofillModelExperimentGroup } from '@proton/pass/store/selectors';
import type { AutofillModelExperimentGroup } from '@proton/pass/types/api/features';

export const useAutofillModelExperimentGroup = (): AutofillModelExperimentGroup =>
    useSelector(selectAutofillModelExperimentGroup);
