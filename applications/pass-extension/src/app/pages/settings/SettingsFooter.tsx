import { memo } from 'react';

import { APP_VERSION } from 'proton-pass-extension/app/config';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const SettingsFooter = memo(() => (
    <div className="mt-auto">
        <hr />
        <span className="block text-sm color-weak text-center">
            {PASS_APP_NAME} v{APP_VERSION}
        </span>
    </div>
));

SettingsFooter.displayName = 'SettingsFooterMemo';
