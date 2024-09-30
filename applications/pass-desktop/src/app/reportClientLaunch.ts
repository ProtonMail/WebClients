import { api } from '@proton/pass/lib/api/api';
import { reportClientLaunch } from '@proton/shared/lib/desktop/reportClientLaunch';

export default async () => {
    const { installSource = null } = (await window.ctxBridge?.getInstallInfo()) ?? {};
    await reportClientLaunch(installSource, 'pass', api);
    void window.ctxBridge?.setInstallSourceReported();
};
