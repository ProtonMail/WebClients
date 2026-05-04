import { selectOrganizationTheme } from '@proton/account/organization/theme';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

export const useOrganizationTheme = () => {
    return useSelector(selectOrganizationTheme);
};
