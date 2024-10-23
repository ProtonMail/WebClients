import { useEffect, useState } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    type ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useErrorHandler,
    useModalState,
} from '@proton/components';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ConfirmDenyMemberAuthDevice from './ConfirmDenyMemberAuthDevice';
import MemberAuthDevicesModal from './MemberAuthDevicesModal';
import MembersAuthDevicesList from './MembersAuthDevicesList';
import { rejectMemberAuthDevice } from './memberAuthDeviceActions';
import type { MemberAuthDevicesState, PendingAdminActivation, PendingAdminActivations } from './memberAuthDevices';

interface Props extends Omit<ModalProps<'div'>, 'children' | 'buttons'> {
    pendingAdminActivationsWithMembers: PendingAdminActivations;
}

const MembersAuthDevicesModal = ({ pendingAdminActivationsWithMembers, ...rest }: Props) => {
    const n = pendingAdminActivationsWithMembers.length;
    const [pendingMemberAuthDevice, setPendingMemberAuthDevice] = useState<PendingAdminActivation | null>(null);
    const [grantModalProps, setGrantModal, renderGrantModal] = useModalState();
    const [denyModalProps, setDenyModal, renderDenyModal] = useModalState();
    const errorHandler = useErrorHandler();
    const dispatch = baseUseDispatch<ThunkDispatch<MemberAuthDevicesState, ProtonThunkArguments, Action>>();
    const [loadingMap, , setLoading] = useLoadingByKey();

    useEffect(() => {
        if (!n) {
            rest.onClose?.();
        }
    }, [n]);

    return (
        <>
            {renderGrantModal && pendingMemberAuthDevice && (
                <MemberAuthDevicesModal
                    pendingMemberAuthDevice={pendingMemberAuthDevice}
                    {...grantModalProps}
                    onExit={() => {
                        setPendingMemberAuthDevice(null);
                        grantModalProps.onExit();
                    }}
                />
            )}
            {renderDenyModal && pendingMemberAuthDevice && (
                <ConfirmDenyMemberAuthDevice
                    pendingMemberAuthDevice={pendingMemberAuthDevice}
                    onConfirm={async () => {
                        if (!pendingMemberAuthDevice) {
                            return;
                        }
                        const { member, memberAuthDevice } = pendingMemberAuthDevice;
                        try {
                            setLoading(memberAuthDevice.ID, true);
                            await dispatch(
                                rejectMemberAuthDevice({
                                    type: 'reject',
                                    memberID: member.ID,
                                    memberAuthDevice,
                                })
                            );
                        } catch (e) {
                            errorHandler(e);
                        } finally {
                            setLoading(memberAuthDevice.ID, false);
                        }
                    }}
                    {...denyModalProps}
                    onExit={() => {
                        setPendingMemberAuthDevice(null);
                        grantModalProps.onExit();
                    }}
                />
            )}
            <ModalTwo {...rest} size="xlarge">
                <ModalTwoHeader title={c('sso').t`Grant access to users?`} />
                <ModalTwoContent>
                    <p className="text-break">
                        {c('sso').ngettext(
                            msgid`${n} user is requesting your help to sign in to their ${BRAND_NAME} Account with single sign-on.`,
                            `${n} users are requesting your help to sign in to their ${BRAND_NAME} Account with single sign-on.`,
                            n
                        )}
                    </p>
                    <div>
                        <MembersAuthDevicesList
                            pendingAdminActivationsWithMembers={pendingAdminActivationsWithMembers}
                            loading={false}
                            loadingMap={loadingMap}
                            onApprove={(pendingAdminActivation) => {
                                setPendingMemberAuthDevice(pendingAdminActivation);
                                setGrantModal(true);
                            }}
                            onReject={(pendingAdminActivation) => {
                                setPendingMemberAuthDevice(pendingAdminActivation);
                                setDenyModal(true);
                            }}
                        />
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter>
                    <div></div>
                    <Button color="norm" onClick={rest.onClose}>{c('sso').t`Cancel`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default MembersAuthDevicesModal;
