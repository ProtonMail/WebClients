import { useEffect, useState } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Badge,
    ButtonGroup,
    Icon,
    Prompt,
    SettingsSectionWide,
    Table,
    TableBody,
    TableHeader,
    TableRow,
    Time,
    useErrorHandler,
    useModalState,
    useNotifications,
} from '@proton/components';
import useLoading, { useLoadingByKey } from '@proton/hooks/useLoading';
import { baseUseDispatch } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type AuthDeviceOutput,
    AuthDeviceState,
    getLocalizedDeviceState,
    getPersistedAuthDeviceDataByUser,
} from '@proton/shared/lib/keys/device';
import noop from '@proton/utils/noop';

import { userThunk } from '../user';
import { AuthDevicesModal } from './AuthDevicesModal';
import ConfirmRejectAuthDevice from './ConfirmRejectAuthDevice';
import ConfirmRemoveAuthDevice from './ConfirmRemoveAuthDevice';
import { deleteAllOtherAuthDevice, rejectAuthDevice } from './authDeviceActions';
import type { AuthDevicesState } from './authDevices';
import { useAuthDevices } from './authDevicesHooks';

const AuthDevicesSettings = () => {
    const [authDevices, authDevicesLoading] = useAuthDevices();
    const { createNotification } = useNotifications();
    const dispatch = baseUseDispatch<ThunkDispatch<AuthDevicesState, ProtonThunkArguments, Action>>();
    const [currentAuthDeviceID, setCurrentAuthDeviceID] = useState<string>('');
    const [loadingMap, , setLoading] = useLoadingByKey();
    const [loadingDeleteAll, withLoadingDeleteAll] = useLoading();
    const [tmpAuthDevice, setTmpAuthDevice] = useState<AuthDeviceOutput | null>(null);
    const [approveModal, setApproveModal, renderApproveModal] = useModalState();
    const [rejectModal, setRejectModal, renderRejectModal] = useModalState();
    const [removeModal, setRemoveModal, renderRemoveModal] = useModalState();
    const [confirmDeleteAllModal, setConfirmDeleteAll, renderConfirmDeleteAll] = useModalState();
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const run = async () => {
            const user = await dispatch(userThunk());
            const currentDevice = getPersistedAuthDeviceDataByUser({ user });
            if (currentDevice) {
                setCurrentAuthDeviceID(currentDevice.id);
                return;
            }
        };
        run().catch(noop);
    }, []);

    const handleApproveDevice = (pendingAuthDevice: AuthDeviceOutput) => {
        setTmpAuthDevice(pendingAuthDevice);
        setApproveModal(true);
    };

    const handleConfirmRejectDevice = (pendingAuthDevice: AuthDeviceOutput) => {
        setTmpAuthDevice(pendingAuthDevice);
        setRejectModal(true);
    };

    const handleConfirmRemoveDevice = (pendingAuthDevice: AuthDeviceOutput) => {
        setTmpAuthDevice(pendingAuthDevice);
        setRemoveModal(true);
    };

    const handleRejectDevice = async (pendingAuthDevice: AuthDeviceOutput, type: 'reject' | 'delete') => {
        try {
            setLoading(pendingAuthDevice.ID, true);
            await dispatch(rejectAuthDevice({ pendingAuthDevice, type }));
            if (type === 'reject') {
                createNotification({ text: c('Success').t`Device rejected` });
            } else {
                createNotification({ text: c('Success').t`Device deleted` });
            }
        } finally {
            setLoading(pendingAuthDevice.ID, false);
        }
    };

    const sortedAuthDevices = [...(authDevices || [])].sort((a, b) => {
        return b.CreateTime - a.CreateTime;
    });

    const currentAuthDevice = sortedAuthDevices.find(({ ID }) => ID === currentAuthDeviceID);

    return (
        <>
            {renderApproveModal && tmpAuthDevice && (
                <AuthDevicesModal
                    pendingAuthDevice={tmpAuthDevice}
                    {...approveModal}
                    onExit={() => {
                        approveModal.onExit();
                        setTmpAuthDevice(null);
                    }}
                />
            )}
            {renderRejectModal && tmpAuthDevice && (
                <ConfirmRejectAuthDevice
                    pendingAuthDevice={tmpAuthDevice}
                    onConfirm={() => {
                        handleRejectDevice(tmpAuthDevice, 'reject').catch(errorHandler);
                    }}
                    {...rejectModal}
                    onExit={() => {
                        approveModal.onExit();
                        setTmpAuthDevice(null);
                    }}
                />
            )}
            {renderRemoveModal && tmpAuthDevice && (
                <ConfirmRemoveAuthDevice
                    authDevice={tmpAuthDevice}
                    onConfirm={() => {
                        handleRejectDevice(tmpAuthDevice, 'delete').catch(errorHandler);
                    }}
                    {...removeModal}
                    onExit={() => {
                        approveModal.onExit();
                        setTmpAuthDevice(null);
                    }}
                />
            )}
            {renderConfirmDeleteAll && currentAuthDevice && (
                <Prompt
                    {...confirmDeleteAllModal}
                    title={c('sso').t`Remove all other devices`}
                    buttons={[
                        <Button
                            color="norm"
                            onClick={() => {
                                withLoadingDeleteAll(dispatch(deleteAllOtherAuthDevice({ currentAuthDevice }))).catch(
                                    errorHandler
                                );
                                confirmDeleteAllModal.onClose();
                            }}
                        >
                            {c('Action').t`Remove all other devices`}
                        </Button>,
                        <Button onClick={confirmDeleteAllModal.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    {c('sso').t`Do you want to remove all other devices than the current one?`}
                </Prompt>
            )}
            <SettingsSectionWide>
                {currentAuthDevice && sortedAuthDevices.length > 1 && (
                    <div className="my-2">
                        <Button shape="outline" onClick={() => setConfirmDeleteAll(true)} loading={loadingDeleteAll}>
                            {c('Action').t`Remove all other devices`}
                        </Button>
                    </div>
                )}
                <Table hasActions responsive="cards">
                    <TableHeader
                        cells={[c('Title').t`Name`, c('Title').t`Created`, c('Title').t`State`, c('Title').t`Actions`]}
                    />
                    <TableBody loading={authDevicesLoading} colSpan={4}>
                        {sortedAuthDevices.map((authDevice) => {
                            const key = authDevice.ID;
                            const isCurrentAuthDevice = authDevice.ID === currentAuthDeviceID;
                            return (
                                <TableRow
                                    key={key}
                                    labels={[
                                        c('Title').t`Name`,
                                        c('Title').t`Created`,
                                        c('Title').t`State`,
                                        c('Title').t`Actions`,
                                    ]}
                                    cells={[
                                        <>
                                            <div className="text-bold">{authDevice.Name}</div>
                                            <div className="color-weak">{authDevice.LocalizedClientName}</div>
                                        </>,
                                        <>
                                            <Time format="PPp" key={1}>
                                                {authDevice.CreateTime}
                                            </Time>
                                        </>,
                                        (() => {
                                            if (isCurrentAuthDevice) {
                                                return (
                                                    <Badge type="success" className="">
                                                        {c('sso').t`Current device`}
                                                    </Badge>
                                                );
                                            }
                                            if (authDevice.State === AuthDeviceState.Active) {
                                                return null;
                                            }
                                            return (
                                                <Badge
                                                    type={(() => {
                                                        switch (authDevice.State) {
                                                            case AuthDeviceState.PendingAdminActivation:
                                                            case AuthDeviceState.PendingActivation:
                                                                return 'warning';
                                                            case AuthDeviceState.Rejected:
                                                                return 'error';
                                                            default:
                                                                return 'origin';
                                                        }
                                                    })()}
                                                    className=""
                                                >
                                                    {getLocalizedDeviceState(authDevice.State)}
                                                </Badge>
                                            );
                                        })(),
                                        (() => {
                                            if (isCurrentAuthDevice) {
                                                return;
                                            }

                                            if (
                                                authDevice.ActivationToken &&
                                                (authDevice.State === AuthDeviceState.PendingActivation ||
                                                    authDevice.State === AuthDeviceState.PendingAdminActivation)
                                            ) {
                                                return (
                                                    <ButtonGroup size="small" individualButtonColor={true}>
                                                        <Button onClick={() => handleApproveDevice(authDevice)}>
                                                            <div className="flex items-center flex-nowrap gap-1">
                                                                <Icon name="checkmark" className="shrink-0" />
                                                                <span className="text-ellipsis">
                                                                    {c('sso').t`Approve`}
                                                                </span>
                                                            </div>
                                                        </Button>
                                                        <Button
                                                            color="danger"
                                                            loading={loadingMap[authDevice.ID]}
                                                            onClick={() => handleConfirmRejectDevice(authDevice)}
                                                        >
                                                            <div className="flex items-center flex-nowrap gap-1">
                                                                <Icon name="cross" className="shrink-0" />
                                                                <span className="text-ellipsis">
                                                                    {c('sso').t`Reject`}
                                                                </span>
                                                            </div>
                                                        </Button>
                                                    </ButtonGroup>
                                                );
                                            }

                                            return (
                                                <Button
                                                    size="small"
                                                    loading={loadingMap[authDevice.ID]}
                                                    onClick={() => handleConfirmRemoveDevice(authDevice)}
                                                >
                                                    {c('sso').t`Remove`}
                                                </Button>
                                            );
                                        })(),
                                    ]}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </SettingsSectionWide>
        </>
    );
};

export default AuthDevicesSettings;
