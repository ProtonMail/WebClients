import { useRef, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { dismissOnboardingSurvey, submitOnboardingSurvey } from '@proton/shared/lib/api/onboardingSurvey';
import { useVariant } from '@proton/unleash/useVariant';
import noop from '@proton/utils/noop';

import { getSurveyVariant } from '../survey/getSurveyVariant';
import {
    type OnboardingSurveyAnswers as OnboardingSurveyForm,
    validateSurveyAnswers,
} from '../survey/validateSurveyAnswers';

export const usePostSignupSurvey = () => {
    const api = useApi();
    const rawVariant = useVariant('PostSignupSurveyExperiment');
    const [form, setForm] = useState<OnboardingSurveyForm>();

    // Mirrors `form` so a `submit` right after a `saveAnswers`, in the same handler, sees the latest answers
    const formRef = useRef<OnboardingSurveyForm>(undefined);
    const outcomeRef = useRef<'submitted' | 'dismissed'>(undefined);

    const saveAnswers = (answers: OnboardingSurveyForm) => {
        formRef.current = { ...formRef.current, ...answers };
        setForm(formRef.current);
    };

    const report = (outcome: 'submitted' | 'dismissed') => {
        const variant = getSurveyVariant(rawVariant.name);
        // Without an arm the user is not in the experiment, there is nothing to report
        if (outcomeRef.current || !variant) {
            return;
        }

        // A dismissal needs no answers, a submit is only sent when its answers are valid
        const payload = outcome === 'submitted' ? validateSurveyAnswers(variant, formRef.current) : undefined;
        if (outcome === 'submitted' && !payload) {
            return;
        }

        outcomeRef.current = outcome;
        const request = payload ? submitOnboardingSurvey(payload) : dismissOnboardingSurvey(variant);
        api({ ...request, silence: true }).catch(noop);
    };

    return {
        form,
        saveAnswers,
        submit: () => report('submitted'),
        dismiss: () => report('dismissed'),
    };
};
