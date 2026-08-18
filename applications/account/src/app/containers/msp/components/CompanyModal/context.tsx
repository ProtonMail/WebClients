import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';

import type { CompanyFormData, MspCompany } from '../../types';

interface CompanyModalContextValue {
    mode: 'add' | 'edit';
    isEditing: boolean;
    name: string;
    setName: (name: string) => void;
    seatsText: string;
    setSeatsText: (seatsText: string) => void;
    assignedSeats: number;
    minSeats: number;
    isSubmitting: boolean;
    handleSubmit: () => Promise<void>;
}

const CompanyModalContext = createContext<CompanyModalContextValue | null>(null);

export const useCompanyModalContext = () => {
    const context = useContext(CompanyModalContext);
    if (!context) {
        throw new Error('useCompanyModalContext must be used within a CompanyModalProvider');
    }
    return context;
};

interface Props {
    mode: 'add' | 'edit';
    initial?: MspCompany;
    onSave: (data: CompanyFormData) => Promise<void>;
    children: ReactNode;
}

export const CompanyModalProvider = ({ mode, initial, onSave, children }: Props) => {
    const isEditing = mode === 'edit' && !!initial;

    const [name, setName] = useState(initial?.name ?? '');
    const [seatsText, setSeatsText] = useState(String(initial?.assignedSeats ?? 1));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const minSeats = Math.max(1, initial?.usedSeats ?? 0);
    const assignedSeats = Math.max(minSeats, parseInt(seatsText, 10) || minSeats);

    const handleSubmit = async () => {
        if (isSubmitting || !name.trim() || assignedSeats < minSeats) {
            return;
        }
        setIsSubmitting(true);
        try {
            await onSave({
                name: name.trim(),
                assignedSeats,
                status: initial?.status ?? ORGANIZATION_STATE.ACTIVE,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const value: CompanyModalContextValue = {
        mode,
        isEditing,
        name,
        setName,
        seatsText,
        setSeatsText,
        assignedSeats,
        minSeats,
        isSubmitting,
        handleSubmit,
    };

    return <CompanyModalContext.Provider value={value}>{children}</CompanyModalContext.Provider>;
};
