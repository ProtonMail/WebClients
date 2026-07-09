import { addCompanyThunk, setCompanyStatusThunk, updateCompanyThunk } from '@proton/account/mspSubsidiaries/actions';
import { useMspSubsidiaries } from '@proton/account/mspSubsidiaries/hooks';
import { manageCompanyThunk } from '@proton/account/mspSubsidiaries/manageCompanyAction';
import { useMspDispatch } from '@proton/account/mspSubsidiaries/useMspDispatch';
import { MSP_SUBSIDIARY_STATUS } from '@proton/shared/lib/interfaces/MspSubsidiary';
import type { MspSubsidiary } from '@proton/shared/lib/interfaces/MspSubsidiary';

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

const useMspCompanies = () => {
    const dispatch = useMspDispatch();
    const [subsidiaries, loading] = useMspSubsidiaries();
    const companies = (subsidiaries ?? []).map(toCompany);

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
