import { useEffect } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import { membersThunk } from '@proton/account/members';
import { organizationKeyThunk } from '@proton/account/organizationKey';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import noop from '@proton/utils/noop';

import MembersAuthDevicesModal from './MembersAuthDevicesModal';
import {
    type MemberAuthDevicesState,
    memberAuthDevicesThunk,
    selectPendingMemberAuthDevices,
} from './memberAuthDevices';

const getBannerText = ({ n, passwordResetCount }: { n: number; passwordResetCount: number }) => {
    if (passwordResetCount === 0) {
        return c('sso').ngettext(
            msgid`${n} member requested your help to sign in.`,
            `${n} members requested your help to sign in.`,
            n
        );
    }
    if (passwordResetCount === n) {
        return c('member_password_reset').ngettext(
            msgid`${n} member requested a password reset.`,
            `${n} members requested a password reset.`,
            n
        );
    }
    return c('member_password_reset').ngettext(
        msgid`${n} member needs your approval.`,
        `${n} members need your approval.`,
        n
    );
};

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
    const passwordResetCount = pendingAdminActivationsWithMembers.filter(
        ({ memberAuthDevice }) => memberAuthDevice.IsRecovery
    ).length;

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
                    {getBannerText({ n, passwordResetCount })}{' '}
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
