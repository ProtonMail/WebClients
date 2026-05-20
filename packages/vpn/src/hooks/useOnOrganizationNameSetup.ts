import { c } from 'ttag';

import { setKeys, setupAdminVpnConnections, updateOrganizationName } from '@proton/account/organization/actions';
import { useNotifications } from '@proton/components/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

export const useOnOrganizationNameSetup = () => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const onOrganizationNameSetup = async (name: string) => {
        await dispatch(setupAdminVpnConnections());
        await dispatch(updateOrganizationName({ name }));
        await dispatch(setKeys());
        createNotification({ text: c('Success').t`Organization activated` });
    };

    return onOrganizationNameSetup;
};
