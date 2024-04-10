import { selectOrganizationTheme } from '@proton/account/organization/theme';
import { useSelector } from '@proton/redux-shared-store';

export const useOrganizationTheme = () => {
    return useSelector(selectOrganizationTheme);
};
