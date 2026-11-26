import type { APP_NAMES } from '@proton/shared/lib/constants';

import { SsoAdvancedSettings } from './SsoAdvancedSettings';
import { SsoSamlSettings } from './SsoSamlSettings';
import { SsoScimSettings } from './SsoScimSettings';
import { SsoSettingsProvider } from './SsoSettingsProvider';

/** All SSO settings on one page, as mounted in Account. Console mounts SCIM on its own page. */
const SsoPage = ({ app }: { app: APP_NAMES }) => (
    <SsoSettingsProvider app={app}>
        <SsoSamlSettings />
        <SsoScimSettings />
        <SsoAdvancedSettings />
    </SsoSettingsProvider>
);

export default SsoPage;
