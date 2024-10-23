import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { AbstractAuthDevicesModal } from '@proton/account/sso/AbstractAuthDeviceModal';
import { Button } from '@proton/atoms';
import { TopBar } from '@proton/pass/components/Layout/Bar/TopBar';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { confirmPendingAuthDevice, rejectPendingAuthDevice } from '@proton/pass/store/actions/creators/sso';
import { selectPendingAuthDevices } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import type { AuthDeviceOutput } from '@proton/shared/lib/keys/device';

export const AuthDeviceTopBanner: FC = () => {
    const pendingAuthDevices = useSelector(selectPendingAuthDevices);
    const [open, setOpen] = useState(false);
    const [tmpAuthDevice, setTmpAuthDevice] = useState<MaybeNull<AuthDeviceOutput>>(null);

    const pendingAuthDevice = pendingAuthDevices?.[0];
    const confirm = useRequest(confirmPendingAuthDevice, { onSuccess: () => setOpen(false) });
    const reject = useRequest(rejectPendingAuthDevice, { onSuccess: () => setOpen(false) });

    return pendingAuthDevice ? (
        <>
            <TopBar visible className="bg-warning ui-orange justify-center text-center">
                <span>{c('sso').t`Sign-in requested on another device. Was it you? `}</span>
                <Button
                    pill
                    size="small"
                    className="text-semibold"
                    shape="underline"
                    color="norm"
                    onClick={() => {
                        setTmpAuthDevice(pendingAuthDevice);
                        setOpen(true);
                    }}
                >
                    {c('sso').t`Approve or deny it now`}
                </Button>
            </TopBar>
            {tmpAuthDevice && (
                <AbstractAuthDevicesModal
                    open={open}
                    loading={confirm.loading}
                    pendingAuthDevice={tmpAuthDevice}
                    onConfirm={async (data) => confirm.dispatch(data)}
                    onReject={async (data) => reject.dispatch(data)}
                    onExit={() => {
                        setTmpAuthDevice(null);
                    }}
                />
            )}
        </>
    ) : null;
};
