import React from 'react';
import { CompatibilityCheckView, getCompatibilityList } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

export default { title: 'Proton UI / Errors' };

export {
    GenericError,
    InternalServerError,
    AccessDeniedError,
    NotFoundError,
    StandardLoadErrorPage,
} from 'react-components';

export const CompatibilityCheck = () => {
    return <CompatibilityCheckView appName={APPS.PROTONMAIL} incompatibilities={getCompatibilityList()} />;
};
