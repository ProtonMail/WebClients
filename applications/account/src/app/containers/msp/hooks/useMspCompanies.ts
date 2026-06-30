import { useState } from 'react';

import generateUID from '@proton/utils/generateUID';

import MOCK_COMPANIES from '../mock/companies';
import type { CompanyFormData, CompanyStatus, MspCompany } from '../types';

// Replace this hook's internals with real API calls when the API is ready.
// The returned interface should remain stable so the component needs no changes.
const useMspCompanies = () => {
    const [companies, setCompanies] = useState<MspCompany[]>(MOCK_COMPANIES);

    const addCompany = (data: CompanyFormData): MspCompany => {
        const newCompany: MspCompany = { id: generateUID('company'), usedSeats: 0, ...data };
        setCompanies((prev) => [...prev, newCompany]);
        return newCompany;
    };

    const updateCompany = (id: string, data: CompanyFormData) => {
        setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    };

    const setCompanyStatus = (id: string, status: CompanyStatus) => {
        setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    };

    return { companies, addCompany, updateCompany, setCompanyStatus };
};

export default useMspCompanies;
