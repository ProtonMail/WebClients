import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { AbstractAuthDevicesModal } from '@proton/account/sso/AbstractAuthDeviceModal';
import { Button } from '@proton/atoms';
import { TopBar } from '@proton/pass/components/Layout/Bar/TopBar';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { confirmPendingAuthDevice, rejectPendingAuthDevice } from '@proton/pass/store/actions/creators/sso';
import { confirmPendingAuthDeviceRequest, rejectPendingAuthDeviceRequest } from '@proton/pass/store/actions/requests';
import { selectPendingAuthDevices } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { first } from '@proton/pass/utils/array/first';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';

type Props = { pendingAuthDevice: AuthDeviceOutput; onExit: () => void };

const AuthDeviceModal: FC<Props> = ({ pendingAuthDevice, onExit }) => {
    const [open, setOpen] = useState(true);
    const onClose = () => setOpen(false);

    const confirm = useRequest(confirmPendingAuthDevice, {
        initialRequestId: confirmPendingAuthDeviceRequest(pendingAuthDevice.ID),
        onSuccess: onClose,
    });

    const reject = useRequest(rejectPendingAuthDevice, {
        initialRequestId: rejectPendingAuthDeviceRequest(pendingAuthDevice.ID),
        onStart: onClose,
    });

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
    const kill = useFeatureFlag(PassFeature.PassKillSSO);
    const pendingAuthDevices = useSelector(selectPendingAuthDevices);
    const [pendingAuthDevice, setPendingAuthDevice] = useState<MaybeNull<AuthDeviceOutput>>(null);
    const tmpAuthDevice = first(pendingAuthDevices);

    return tmpAuthDevice && !kill ? (
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
