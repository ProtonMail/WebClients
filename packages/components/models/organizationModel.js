import { FREE_ORGANIZATION } from 'proton-shared/lib/constants';
import { OrganizationModel } from 'proton-shared/lib/models/organizationModel';
import { useApi, useCachedAsyncResult, useUser } from 'react-components';

export const useOrganization = () => {
    const [user] = useUser();
    const api = useApi();

    return useCachedAsyncResult(
        OrganizationModel.key,
        () => {
            if (user.isPaid) {
                return OrganizationModel.get(api);
            }
            return Promise.resolve(FREE_ORGANIZATION);
        },
        []
    );
};
