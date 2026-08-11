import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

import { mspSubsidiariesActions } from '@proton/account/mspSubsidiaries';
import { getSubsidiaryManagersThunk, unassignMemberFromCompanyThunk } from '@proton/account/mspSubsidiaries/actions';
import { useMspSubsidiaries } from '@proton/account/mspSubsidiaries/hooks';
import { assignMemberToCompanyThunk } from '@proton/account/mspSubsidiaries/manageCompanyAction';
import { useMspDispatch } from '@proton/account/mspSubsidiaries/useMspDispatch';
import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useUser } from '@proton/account/user/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { useErrorHandler } from '@proton/components';
import type { MspDelegatedManager } from '@proton/shared/lib/api/msp';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import type { CompanyFormData, MspCompany } from '../../types';

interface CompanyModalContextValue {
    mode: 'add' | 'edit';
    isEditing: boolean;
    canManageManagers: boolean;
    name: string;
    setName: (name: string) => void;
    seatsText: string;
    setSeatsText: (seatsText: string) => void;
    assignedSeats: number;
    minSeats: number;
    managers: MspDelegatedManager[];
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

// Company fields (name/licenses) are staged here and only sent to the API from `handleSubmit`.
// Delegated managers are added/removed immediately against the API.
export const CompanyModalProvider = ({ mode, initial, onSave, children }: Props) => {
    const dispatch = useMspDispatch();
    const handleError = useErrorHandler();
    const [user] = useUser();
    const isAdminRoleMVPEnabled = useFlag('AdminRoleMVP');
    const [userPermissions] = useUserPermissions();
    const isAdmin = isAdminRoleMVPEnabled ? (userPermissions?.Roles?.some(isOwnerRole) ?? false) : user.isAdmin;
    const isEditing = mode === 'edit' && !!initial;
    // Only admins are allowed to view/assign delegated managers; the backend rejects the request otherwise.
    const canManageManagers = isEditing && isAdmin;

    const [name, setName] = useState(initial?.name ?? '');
    const [seatsText, setSeatsText] = useState(String(initial?.assignedSeats ?? 1));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Read live from the store instead of copying into local state, so it can't drift from the cached companies list.
    const [subsidiaries] = useMspSubsidiaries();
    const managers = subsidiaries?.find((s) => s.ID === initial?.id)?.DelegatedManagers ?? [];
    const [pendingManagerIds, setPendingManagerIds] = useState(new Set<string>());

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
        if (!canManageManagers) {
            return;
        }
        setManagerPending(member.ID, true);
        try {
            const knownManagerIds = new Set(managers.map((manager) => manager.ID));
            await dispatch(assignMemberToCompanyThunk({ id: initial.id, member }));
            // The assign call returns the member's parent-org ID, not the subsidiary-scoped ID managers
            // are keyed by elsewhere, so refetch and diff instead of guessing it. Merging only the new
            // record (rather than replacing the array) avoids clobbering a concurrent add/remove.
            const refreshedManagers = await dispatch(getSubsidiaryManagersThunk({ id: initial.id }));
            const newManager = refreshedManagers.find((manager) => !knownManagerIds.has(manager.ID));
            if (newManager) {
                dispatch(mspSubsidiariesActions.addDelegatedManager({ id: initial.id, manager: newManager }));
            }
        } catch (e) {
            handleError(e);
        } finally {
            setManagerPending(member.ID, false);
        }
    };

    const removeManager = async (managerId: string) => {
        if (!canManageManagers) {
            return;
        }
        setManagerPending(managerId, true);
        try {
            await dispatch(unassignMemberFromCompanyThunk({ id: initial.id, memberId: managerId }));
            // Dispatched synchronously against the latest state, so concurrent removals can't race.
            dispatch(mspSubsidiariesActions.removeDelegatedManager({ id: initial.id, managerId }));
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
                status: initial?.status ?? ORGANIZATION_STATE.ACTIVE,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const value: CompanyModalContextValue = {
        mode,
        isEditing,
        canManageManagers,
        name,
        setName,
        seatsText,
        setSeatsText,
        assignedSeats,
        minSeats,
        managers,
        pendingManagerIds,
        addManager,
        removeManager,
        isSubmitting,
        handleSubmit,
    };

    return <CompanyModalContext.Provider value={value}>{children}</CompanyModalContext.Provider>;
};
