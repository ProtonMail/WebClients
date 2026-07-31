import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { getSubsidiaryManagersThunk, unassignMemberFromCompanyThunk } from '@proton/account/mspSubsidiaries/actions';
import { assignMemberToCompanyThunk } from '@proton/account/mspSubsidiaries/manageCompanyAction';
import { useMspDispatch } from '@proton/account/mspSubsidiaries/useMspDispatch';
import { useErrorHandler } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { MspDelegatedManager } from '@proton/shared/lib/api/msp';
import type { Member } from '@proton/shared/lib/interfaces';

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
    managers: MspDelegatedManager[];
    managersLoading: boolean;
    pendingManagerIds: Set<string>;
    addManager: (member: Member) => Promise<void>;
    removeManager: (managerId: string) => Promise<void>;
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

// Company fields (name/seats) are staged here and only sent to the API from `handleSubmit`.
// Delegated managers are added/removed immediately against the API.
export const CompanyModalProvider = ({ mode, initial, onSave, children }: Props) => {
    const dispatch = useMspDispatch();
    const handleError = useErrorHandler();
    const isEditing = mode === 'edit' && !!initial;

    const [name, setName] = useState(initial?.name ?? '');
    const [seatsText, setSeatsText] = useState(String(initial?.assignedSeats ?? 1));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [managers, setManagers] = useState<MspDelegatedManager[]>([]);
    const [managersLoading, withManagersLoading] = useLoading(isEditing);
    const [pendingManagerIds, setPendingManagerIds] = useState(new Set<string>());

    useEffect(() => {
        if (!isEditing) {
            return;
        }
        void withManagersLoading(dispatch(getSubsidiaryManagersThunk({ id: initial.id })).then(setManagers));
    }, [isEditing, initial?.id]);

    const minSeats = Math.max(1, initial?.usedSeats ?? 0);
    const assignedSeats = Math.max(minSeats, parseInt(seatsText, 10) || minSeats);

    const setManagerPending = (managerId: string, pending: boolean) => {
        setPendingManagerIds((prev) => {
            const next = new Set(prev);
            if (pending) {
                next.add(managerId);
            } else {
                next.delete(managerId);
            }
            return next;
        });
    };

    const addManager = async (member: Member) => {
        if (!isEditing) {
            return;
        }
        setManagerPending(member.ID, true);
        try {
            await dispatch(assignMemberToCompanyThunk({ id: initial.id, member }));
            // The assign call takes the member's parent-org ID, but delegated managers are
            // identified by a different, subsidiary-scoped ID everywhere else (including the
            // unassign call) — refetch instead of guessing that ID for an optimistic append.
            setManagers(await dispatch(getSubsidiaryManagersThunk({ id: initial.id })));
        } catch (e) {
            handleError(e);
        } finally {
            setManagerPending(member.ID, false);
        }
    };

    const removeManager = async (managerId: string) => {
        if (!isEditing) {
            return;
        }
        setManagerPending(managerId, true);
        try {
            await dispatch(unassignMemberFromCompanyThunk({ id: initial.id, memberId: managerId }));
            setManagers((prev) => prev.filter((manager) => manager.ID !== managerId));
        } catch (e) {
            handleError(e);
        } finally {
            setManagerPending(managerId, false);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting || !name.trim() || assignedSeats < minSeats) {
            return;
        }
        setIsSubmitting(true);
        try {
            await onSave({
                name: name.trim(),
                assignedSeats,
                status: initial?.status ?? 'active',
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
        managers,
        managersLoading,
        pendingManagerIds,
        addManager,
        removeManager,
        isSubmitting,
        handleSubmit,
    };

    return <CompanyModalContext.Provider value={value}>{children}</CompanyModalContext.Provider>;
};
