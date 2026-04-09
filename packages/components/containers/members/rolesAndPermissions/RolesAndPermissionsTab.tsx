import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { OrganizationRole } from '@proton/shared/lib/interfaces/OrganizationRole';

import RoleCheckList from './RoleCheckList';

interface Props {
    selectedRoles: Set<string>;
    onChange: (selectedRoles: Set<string>) => void;
    organizationRoles: OrganizationRole[] | undefined;
    loadingRoles: boolean;
}

const RolesAndPermissionsTab = ({ selectedRoles, onChange, organizationRoles, loadingRoles }: Props) => {
    return (
        <>
            <p className="color-weak mt-6 mb-8">
                {c('user_modal')
                    .t`Add delegated roles to a user to grant them only the specific permissions they need, keeping full-admin power separate and your environment secure.`}
            </p>
            {loadingRoles ? (
                <div className="flex justify-center py-4">
                    <CircleLoader />
                </div>
            ) : (
                <RoleCheckList roles={organizationRoles ?? []} selectedRoles={selectedRoles} onChange={onChange} />
            )}
        </>
    );
};

export default RolesAndPermissionsTab;
