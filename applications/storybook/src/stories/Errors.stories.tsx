import React from 'react';
import { Meta } from '@storybook/react/types-6-0';
import { CompatibilityCheckView, getCompatibilityList } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

export default { title: 'Proton UI / Errors' } as Meta;

export { GenericError, InternalServerError, AccessDeniedError, NotFoundError, StandardLoadError } from 'react-components';

export const CompatibilityCheck =  () => {
    return <CompatibilityCheckView appName={APPS.PROTONMAIL} incompatibilities={getCompatibilityList()} />
}
