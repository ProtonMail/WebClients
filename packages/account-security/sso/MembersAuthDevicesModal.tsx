import { useEffect, useState } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { baseUseDispatch } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import ConfirmDenyMemberAuthDevice from './ConfirmDenyMemberAuthDevice';
import MemberAuthDevicesModal from './MemberAuthDevicesModal';
import MembersAuthDevicesList from './MembersAuthDevicesList';
import { rejectMemberAuthDevice } from './memberAuthDeviceActions';
import type { MemberAuthDevicesState, PendingAdminActivation, PendingAdminActivations } from './memberAuthDevices';

const getTitle = ({ n, passwordResetCount }: { n: number; passwordResetCount: number }) => {
    if (passwordResetCount === 0) {
        return c('sso').t`Grant access to users?`;
    }
    if (passwordResetCount === n) {
        return c('member_password_reset').t`Approve password resets?`;
    }
    return c('member_password_reset').t`Approve requests?`;
};

const getDescription = ({ n, passwordResetCount }: { n: number; passwordResetCount: number }) => {
    if (passwordResetCount === 0) {
        return c('sso').ngettext(
            msgid`${n} user is requesting your help to sign in to their ${BRAND_NAME} Account with single sign-on.`,
            `${n} users are requesting your help to sign in to their ${BRAND_NAME} Account with single sign-on.`,
            n
        );
    }
    if (passwordResetCount === n) {
        return c('member_password_reset').ngettext(
            msgid`${n} user requested a password reset for their ${BRAND_NAME} Account.`,
            `${n} users requested a password reset for their ${BRAND_NAME} Account.`,
            n
        );
    }
    return c('member_password_reset').ngettext(
        msgid`${n} user is waiting for your approval.`,
        `${n} users are waiting for your approval.`,
        n
    );
};

interface Props extends Omit<ModalProps<'div'>, 'children' | 'buttons'> {
    pendingAdminActivationsWithMembers: PendingAdminActivations;
}

const MembersAuthDevicesModal = ({ pendingAdminActivationsWithMembers, ...rest }: Props) => {
    const n = pendingAdminActivationsWithMembers.length;
    const passwordResetCount = pendingAdminActivationsWithMembers.filter(
        ({ memberAuthDevice }) => memberAuthDevice.IsRecovery
    ).length;
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
                <ModalTwoHeader title={getTitle({ n, passwordResetCount })} />
                <ModalTwoContent>
                    <p className="text-break">{getDescription({ n, passwordResetCount })}</p>
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
