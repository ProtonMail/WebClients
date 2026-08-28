import { memo } from 'react';

import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import config from '../../config';

export const SettingsFooter = memo(() => (
    <div className="mt-auto">
        <hr />
        <span className="block text-sm color-weak text-center">
            {PASS_APP_NAME} v{config.APP_VERSION}
        </span>
    </div>
));

SettingsFooter.displayName = 'SettingsFooterMemo';
