import { c } from 'ttag';

import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { BRAND_NAME } from '@proton/shared/lib/constants';

/** The password field's label and explanation: an admin or trusted contact enters their own password. */
export const getAuthPasswordCopy = (accessType: AccessType) => {
    if (accessType === AccessType.EmergencyAccess) {
        return {
            info: c('Info').t`Enter your own password (as trusted contact).`,
            label: c('Label').t`Your password (trusted contact)`,
        };
    }
    if (accessType === AccessType.AdminAccess) {
        return {
            info: c('Info').t`Enter your own password (as organization admin).`,
            label: c('Label').t`Your password (admin)`,
        };
    }
    return {
        info: c('Info').t`To help keep your account safe, confirm it’s really you before continuing.`,
        label: c('Label').t`${BRAND_NAME} Account password`,
    };
};
