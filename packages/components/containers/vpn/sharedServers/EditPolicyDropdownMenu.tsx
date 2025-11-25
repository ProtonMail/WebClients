import React from 'react';

import { c } from 'ttag';

import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcEarth } from '@proton/icons/icons/IcEarth';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUsers } from '@proton/icons/icons/IcUsers';

import { POLICY_STEP } from './PolicyModal/modalPolicyStepEnum';
import type { VpnLocationFilterPolicy } from './useSharedServers';

interface EditPolicyDropdownMenuProps {
    policy: VpnLocationFilterPolicy;
    handleEditPolicy: (policy: VpnLocationFilterPolicy, step: number, onSuccess?: () => void) => void;
    handleDeletePolicy: (policy: VpnLocationFilterPolicy, onSuccess?: () => void) => void;
    onClose?: () => void;
}

const EditPolicyDropdownMenu = ({
    policy,
    handleEditPolicy,
    handleDeletePolicy,
    onClose,
}: EditPolicyDropdownMenuProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuButton
                className="text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleEditPolicy(policy, POLICY_STEP.NAME, () => {});
                }}
            >
                <IcPen size={4} /> {c('Action').t`Edit name`}
            </DropdownMenuButton>

            <DropdownMenuButton
                className="text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleEditPolicy(policy, POLICY_STEP.MEMBERS, () => {});
                }}
            >
                <IcUsers size={4} /> {c('Action').t`Edit users`}
            </DropdownMenuButton>

            <DropdownMenuButton
                className="text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleEditPolicy(policy, POLICY_STEP.COUNTRIES, () => {});
                }}
            >
                <IcEarth size={4} /> {c('Action').t`Edit countries`}
            </DropdownMenuButton>

            <hr className="mt-2 mb-0" />

            <DropdownMenuButton
                className="text-left color-danger"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleDeletePolicy(policy, () => {});
                }}
            >
                <IcTrash size={4} /> {c('Action').t`Delete`}
            </DropdownMenuButton>
        </DropdownMenu>
    );
};

export default EditPolicyDropdownMenu;
