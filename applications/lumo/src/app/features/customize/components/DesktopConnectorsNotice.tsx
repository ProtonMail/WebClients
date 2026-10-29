import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import './DesktopConnectorsNotice.scss';

/** Shown on the web, where connectors can't run: they need the desktop app's access to this computer. */
export const DesktopConnectorsNotice = () => (
    <div className="desktop-connectors-notice flex flex-nowrap items-start gap-3" role="note">
        <span className="desktop-connectors-notice__icon flex shrink-0 items-center justify-center">
            <LumoIcon aria-hidden name="Monitor" size={18} />
        </span>
        <div className="flex flex-column flex-nowrap gap-1 min-w-0">
            <span className="text-semibold">
                {c('collider_2025:Title').t`Use ${LUMO_SHORT_APP_NAME} Desktop to use connectors`}
            </span>
            <span className="text-sm color-weak">
                {c('collider_2025:Info')
                    .t`Connectors let ${LUMO_SHORT_APP_NAME} work with apps and tools on your computer, so they're only available in the ${LUMO_SHORT_APP_NAME} Desktop app. Open ${LUMO_SHORT_APP_NAME} Desktop to connect and manage them.`}
            </span>
        </div>
    </div>
);
