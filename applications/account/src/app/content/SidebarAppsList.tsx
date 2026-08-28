import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Logo } from '@proton/components';
import { Branch } from '@proton/components/components/sidebar/nav/Branch';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppShortName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { getSettingsHref } from './helper';

const SidebarAppsList = () => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const { getLocalID } = useAuthentication();
    const localId = getLocalID();
    const isDocsHomepageAvailable = useFlag('DriveDocsLandingPageEnabled');
    const isSheetsAvailable = useFlag('DocsSheetsEnabled');
    const isMeetAvailable = useFlag('PMVC2025');
    const isAuthenticatorAvailable = useFlag('AuthenticatorSettingsEnabled');
    const isSpacesAvailable = useFlag('SpacesAvailable');

    const availableApps = getAvailableApps({
        context: 'dropdown',
        user,
        organization,
        isDocsHomepageAvailable,
        isSheetsAvailable,
        isMeetAvailable,
        isAuthenticatorAvailable,
        isSpacesAvailable,
    });

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
