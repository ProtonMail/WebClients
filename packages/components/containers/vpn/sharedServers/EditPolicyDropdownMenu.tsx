import React from 'react';

import { c } from 'ttag';

import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import withPermissionGuard from '@proton/components/components/orgPermissions/withPermissionGuard';
import { IcEarth } from '@proton/icons/icons/IcEarth';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUsers } from '@proton/icons/icons/IcUsers';

import { POLICY_STEP } from './PolicyModal/modalPolicyStepEnum';
import type { VpnLocationFilterPolicy } from './useSharedServers';

const GuardedMenuButton = withPermissionGuard('account.shared_server.update')(DropdownMenuButton);
const menuTooltip = { wrapperClassName: 'block' };

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
            <GuardedMenuButton
                className="text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleEditPolicy(policy, POLICY_STEP.NAME, () => {});
                }}
                tooltip={menuTooltip}
            >
                <IcPen size={4} /> {c('Action').t`Edit name`}
            </GuardedMenuButton>

            <GuardedMenuButton
                className="text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleEditPolicy(policy, POLICY_STEP.MEMBERS, () => {});
                }}
                tooltip={menuTooltip}
            >
                <IcUsers size={4} /> {c('Action').t`Edit users`}
            </GuardedMenuButton>

            <GuardedMenuButton
                className="text-left"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleEditPolicy(policy, POLICY_STEP.COUNTRIES, () => {});
                }}
                tooltip={menuTooltip}
            >
                <IcEarth size={4} /> {c('Action').t`Edit countries`}
            </GuardedMenuButton>

            <hr className="mt-2 mb-0" />

            <GuardedMenuButton
                className="text-left color-danger"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                    handleDeletePolicy(policy, () => {});
                }}
                tooltip={menuTooltip}
            >
                <IcTrash size={4} /> {c('Action').t`Delete`}
            </GuardedMenuButton>
        </DropdownMenu>
    );
};

export default EditPolicyDropdownMenu;
