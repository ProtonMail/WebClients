import { addCompanyThunk, setCompanyStatusThunk, updateCompanyThunk } from '@proton/account/mspSubsidiaries/actions';
import { useMspSubsidiaries } from '@proton/account/mspSubsidiaries/hooks';
import { manageCompanyThunk } from '@proton/account/mspSubsidiaries/manageCompanyAction';
import { useMspDispatch } from '@proton/account/mspSubsidiaries/useMspDispatch';
import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useUser } from '@proton/account/user/hooks';
import { useUserOrganizations } from '@proton/account/userOrganizations/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { MEMBER_STATE } from '@proton/shared/lib/interfaces/Member';
import { MSP_SUBSIDIARY_STATUS } from '@proton/shared/lib/interfaces/MspSubsidiary';
import type { MspSubsidiary } from '@proton/shared/lib/interfaces/MspSubsidiary';
import type { UserOrganization } from '@proton/shared/lib/interfaces/Organization';
import { useFlag } from '@proton/unleash/useFlag';

import type { CompanyFormData, CompanyStatus, MspCompany } from '../types';

const toCompanyStatus = (status: MspSubsidiary['Status']): CompanyStatus => {
    if (status === MSP_SUBSIDIARY_STATUS.ACTIVE) {
        return 'active';
    }
    if (status === MSP_SUBSIDIARY_STATUS.DISABLED) {
        return 'disabled';
    }
    return 'on-hold';
};

const toCompany = (sub: MspSubsidiary): MspCompany => ({
    id: sub.ID,
    name: sub.Name,
    assignedSeats: sub.MaxMembers,
    usedSeats: sub.ActiveMembers,
    status: toCompanyStatus(sub.Status),
});

// @todo: There're some missing fields from the user organization API, once it's fixed, we should use the correct return value
const toManagedCompany = (userOrganization: UserOrganization): MspCompany => ({
    id: userOrganization.OrganizationID,
    name: userOrganization.OrganizationName,
    assignedSeats: 0,
    usedSeats: 0,
    status: 'active',
});

const useMspCompanies = () => {
    const [user] = useUser();
    const isAdminRoleMVPEnabled = useFlag('AdminRoleMVP');
    const [userPermissions] = useUserPermissions();
    const isOwner = isAdminRoleMVPEnabled ? (userPermissions?.Roles?.some(isOwnerRole) ?? false) : user.isAdmin;
    const dispatch = useMspDispatch();
    const [subsidiaries = [], subsidiariesLoading] = useMspSubsidiaries();
    const [userOrganizations = [], userOrganizationsLoading] = useUserOrganizations();

    const companies = isOwner
        ? subsidiaries.map(toCompany)
        : userOrganizations
              .filter((org) => !org.IsPrimary && org.MemberState === MEMBER_STATE.STATUS_ENABLED)
              .map(toManagedCompany);
    const loading = isOwner ? subsidiariesLoading : userOrganizationsLoading;

    const addCompany = async (data: CompanyFormData) => {
        return dispatch(addCompanyThunk({ data }));
    };

    const updateCompany = async (id: string, data: CompanyFormData) => {
        return dispatch(updateCompanyThunk({ id, data }));
    };

    const setCompanyStatus = async (id: string, status: CompanyStatus) => {
        return dispatch(setCompanyStatusThunk({ id, status }));
    };

    const manageCompany = async (id: string) => {
        return dispatch(manageCompanyThunk({ id }));
    };

    return { companies, loading, addCompany, updateCompany, setCompanyStatus, manageCompany };
};

export default useMspCompanies;
