import { useGetStartedChecklist } from '../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useChecklistTracker } from './checklistEvents';

/** For the components of the checklist, the provider has what the tracker needs to know about the checklist */
export const useChecklistTracking = () => {
    const { canDisplayChecklist, checklistType, createdAt, expiresAt } = useGetStartedChecklist();

    return useChecklistTracker({ canDisplayChecklist, checklistType, createdAt, expiresAt });
};
