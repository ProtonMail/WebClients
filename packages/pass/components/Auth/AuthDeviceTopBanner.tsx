import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { AbstractAuthDevicesModal } from '@proton/account/sso/AbstractAuthDeviceModal';
import { Button } from '@proton/atoms/Button/Button';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';

import { useRequest } from '../../hooks/useRequest';
import { confirmPendingAuthDevice, rejectPendingAuthDevice } from '../../store/actions/creators/sso';
import { selectPendingAuthDevices } from '../../store/selectors';
import type { MaybeNull } from '../../types';
import { first } from '../../utils/array/first';
import { TopBar } from '../Layout/Bar/TopBar';

type Props = { pendingAuthDevice: AuthDeviceOutput; onExit: () => void };

const AuthDeviceModal: FC<Props> = ({ pendingAuthDevice, onExit }) => {
    const [open, setOpen] = useState(true);
    const onClose = () => setOpen(false);

    const confirm = useRequest(confirmPendingAuthDevice, {
        initial: { pendingAuthDevice, confirmationCode: '' },
        onSuccess: onClose,
    });

    const reject = useRequest(rejectPendingAuthDevice, { initial: pendingAuthDevice, onStart: onClose });

    return (
        <AbstractAuthDevicesModal
            open={open}
            loading={confirm.loading}
            pendingAuthDevice={pendingAuthDevice}
            onConfirm={async (data) => confirm.dispatch(data)}
            onReject={async (data) => reject.dispatch(data)}
            onClose={onClose}
            onExit={onExit}
        />
    );
};

export const AuthDeviceTopBanner: FC = () => {
    const pendingAuthDevices = useSelector(selectPendingAuthDevices);
    const [pendingAuthDevice, setPendingAuthDevice] = useState<MaybeNull<AuthDeviceOutput>>(null);
    const tmpAuthDevice = first(pendingAuthDevices);

    return tmpAuthDevice ? (
        <>
            <TopBar visible className="bg-warning ui-orange justify-center text-center">
                <span>{c('sso').t`Sign-in requested on another device. Was it you? `}</span>
                <Button
                    pill
                    size="small"
                    className="text-semibold"
                    shape="underline"
                    color="norm"
                    onClick={() => setPendingAuthDevice(tmpAuthDevice)}
                >
                    {c('sso').t`Approve or deny it now`}
                </Button>
            </TopBar>
            {pendingAuthDevice && (
                <AuthDeviceModal pendingAuthDevice={pendingAuthDevice} onExit={() => setPendingAuthDevice(null)} />
            )}
        </>
    ) : null;
};
