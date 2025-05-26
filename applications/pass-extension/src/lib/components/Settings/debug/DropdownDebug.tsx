import type { FC } from 'react';

import { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import { DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { Dropdown } from 'proton-pass-extension/app/content/injections/apps/dropdown/Dropdown';

import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/lib/password/constants';
import { AppStatus } from '@proton/pass/types';

import { MockIFrameApp } from './MockIFrameApp';

export const DropdownDebug: FC = () => {
    return (
        <SettingsPanel title="Dropdown">
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameApp appState={{ authorized: false, status: AppStatus.IDLE }} width={DROPDOWN_WIDTH}>
                    <Dropdown />
                </MockIFrameApp>

                <MockIFrameApp width={DROPDOWN_WIDTH} appState={{ authorized: false, status: AppStatus.UNAUTHORIZED }}>
                    <Dropdown
                        initial={{
                            action: DropdownAction.AUTOFILL_LOGIN,
                            domain: 'proton.me',
                            startsWith: '',
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp appState={{ status: AppStatus.SESSION_LOCKED }} width={DROPDOWN_WIDTH}>
                    <Dropdown
                        initial={{
                            action: DropdownAction.AUTOFILL_LOGIN,
                            domain: 'proton.me',
                            startsWith: '',
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={DROPDOWN_WIDTH}>
                    <Dropdown
                        initial={{
                            action: DropdownAction.AUTOFILL_LOGIN,
                            domain: 'proton.me',
                            startsWith: '',
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={DROPDOWN_WIDTH}>
                    <Dropdown
                        initial={{
                            action: DropdownAction.AUTOFILL_LOGIN,
                            domain: 'proton.me',
                            startsWith: '',
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={DROPDOWN_WIDTH}>
                    <Dropdown
                        initial={{
                            action: DropdownAction.AUTOFILL_LOGIN,
                            domain: 'proton.me',
                            startsWith: '',
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={DROPDOWN_WIDTH}>
                    <Dropdown
                        initial={{
                            action: DropdownAction.AUTOSUGGEST_PASSWORD,
                            config: DEFAULT_RANDOM_PW_OPTIONS,
                            domain: 'proton.me',
                            copy: false,
                            policy: null,
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={DROPDOWN_WIDTH}>
                    <Dropdown
                        initial={{
                            action: DropdownAction.AUTOSUGGEST_ALIAS,
                            domain: 'proton.me',
                            prefix: 'secret',
                        }}
                    />
                </MockIFrameApp>
            </div>
        </SettingsPanel>
    );
};
