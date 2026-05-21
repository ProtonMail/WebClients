import { c } from 'ttag';

import { initOrganization } from '@proton/account/organization/actions';
import { useNotifications } from '@proton/components/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';

export const useOnOrganizationNameSetup = () => {
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    return async function onOrganizationNameSetup(name: string) {
        await dispatch(initOrganization({ name }));
        createNotification({ text: c('Success').t`Organization activated` });
    };
};
