import { isElectronOnMac } from '@proton/shared/lib/helpers/desktop';

import ElectronDraggeableHeader from './ElectronDraggeableHeader';

/**
 * This component adds a drageable area at the top of the windows
 * if the client is using an Electron application on macOS.
 * Only macOS because we display the title bar on Windows.
 *
 * The drageable area is in a separate component so it can be used
 * at places where Unleash is not yet available (e.g. the login page or some error pages).
 */
const ElectronDraggeableHeaderWrapper = () => {
    const isElectronOnMacComputers = isElectronOnMac();
    if (!isElectronOnMacComputers) {
        return null;
    }

    return <ElectronDraggeableHeader />;
};

export default ElectronDraggeableHeaderWrapper;
