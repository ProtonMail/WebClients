import { c } from 'ttag';

import { useAvailableApps } from '@proton/account/availableApps/hooks';
import Logo from '@proton/components/components/logo/Logo';
import { Branch } from '@proton/components/components/sidebar/nav/Branch';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { getAppShortName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import { getSettingsHref } from './helper';

const SidebarAppsList = () => {
    const availableApps = useAvailableApps();
    const { getLocalID } = useAuthentication();
    const localId = getLocalID();

    if (!availableApps.length) {
        return null;
    }

    return (
        <Branch>
            <Branch.Header>
                <Branch.Trigger rotation={{ closed: 270 }} />
                <span className="color-weak text-normal">{c('Label').t`App Settings`}</span>
            </Branch.Header>
            <Branch.Content>
                <ul className="unstyled m-0 mb-2">
                    {availableApps.map((app) => {
                        let name = getAppShortName(app);
                        if (app === APPS.PROTONLUMO) {
                            name = `${name} AI`;
                        }
                        return (
                            <li key={app}>
                                <a
                                    href={getSettingsHref(app, localId)}
                                    className="interactive-pseudo-inset relative flex flex-nowrap items-center gap-2 py-1 px-3 text-no-decoration rounded"
                                    style={{ '--link-hover': 'var(--text-norm)' }}
                                    aria-label={name}
                                >
                                    <Logo appName={app} variant="glyph-only" size={4} className="shrink-0" />
                                    <span className="text-ellipsis">{name}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </Branch.Content>
        </Branch>
    );
};

export default SidebarAppsList;
