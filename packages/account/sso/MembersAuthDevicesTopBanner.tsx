import { useEffect } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { TopBanner, useModalState } from '@proton/components';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import { membersThunk } from '../members';
import { organizationKeyThunk } from '../organizationKey';
import MembersAuthDevicesModal from './MembersAuthDevicesModal';
import {
    type MemberAuthDevicesState,
    memberAuthDevicesThunk,
    selectPendingMemberAuthDevices,
} from './memberAuthDevices';

const MembersAuthDevicesTopBanner = () => {
    const [modalProps, setModal, renderModal] = useModalState();
    const { pendingAdminActivationsWithMembers } = baseUseSelector(selectPendingMemberAuthDevices);
    const dispatch = baseUseDispatch<ThunkDispatch<MemberAuthDevicesState, ProtonThunkArguments, Action>>();

    useEffect(() => {
        Promise.all([
            dispatch(memberAuthDevicesThunk()),
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]).catch(noop);
    }, []);

    const n = pendingAdminActivationsWithMembers.length;

    return (
        <>
            {renderModal && (
                <MembersAuthDevicesModal
                    pendingAdminActivationsWithMembers={pendingAdminActivationsWithMembers}
                    {...modalProps}
                />
            )}
            {n > 0 && (
                <TopBanner className="bg-warning">
                    {c('sso').ngettext(
                        msgid`${n} member requested your help to sign in.`,
                        `${n} members requested your help to sign in.`,
                        n
                    )}{' '}
                    <InlineLinkButton
                        key="button"
                        onClick={() => {
                            setModal(true);
                        }}
                    >
                        {c('sso').t`Approve or deny it now`}
                    </InlineLinkButton>
                </TopBanner>
            )}
        </>
    );
};

export default MembersAuthDevicesTopBanner;
