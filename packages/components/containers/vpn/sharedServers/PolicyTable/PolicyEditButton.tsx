import React from 'react';

import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';

import EditPolicyDropdownMenu from '../EditPolicyDropdownMenu';
import type { VpnLocationFilterPolicy } from '../useSharedServers';

const PolicyEditButton = ({
    policy,
    handleEditPolicy,
    handleDeletePolicy,
}: {
    policy: VpnLocationFilterPolicy;
    handleEditPolicy: (policy: VpnLocationFilterPolicy, step: number, onSuccess?: () => void) => void;
    handleDeletePolicy: (policy: VpnLocationFilterPolicy, onSuccess?: () => void) => void;
}) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
                shape="ghost"
                size="small"
            >
                {c('Action').t`Edit`} <IcThreeDotsVertical alt={c('Action').t`Edit`} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <EditPolicyDropdownMenu
                    policy={policy}
                    handleEditPolicy={handleEditPolicy}
                    handleDeletePolicy={handleDeletePolicy}
                    onClose={close}
                />
            </Dropdown>
        </>
    );
};

export default PolicyEditButton;
