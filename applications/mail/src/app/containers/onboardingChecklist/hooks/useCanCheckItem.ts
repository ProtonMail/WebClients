import { useSubscription, useUser, useUserSettings } from '@proton/components/hooks';
import { canCheckItemGetStarted, canCheckItemPaidChecklist } from '@proton/shared/lib/helpers/subscription';

// This is used to make sure user can check an item in the checklist and avoid visible errors
const useCanCheckItem = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();

    const canMarkItemsAsDone =
        (canCheckItemPaidChecklist(subscription) && userSettings.Checklists?.includes('paying-user')) ||
        (canCheckItemGetStarted(subscription) && userSettings.Checklists?.includes('get-started')) ||
        user.isFree;

    return { canMarkItemsAsDone };
};

export default useCanCheckItem;
