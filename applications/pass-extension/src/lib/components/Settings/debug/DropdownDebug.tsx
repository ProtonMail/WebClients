import type { FC } from 'react';

import { DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { Dropdown } from 'proton-pass-extension/app/content/injections/apps/dropdown/Dropdown';
import { DropdownAction } from 'proton-pass-extension/app/content/types';

import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/lib/password/constants';
import { AppStatus } from '@proton/pass/types';

import { MockIFrameContainer } from './MockIFrameContainer';

export const DropdownDebug: FC = () => {
    return (
        <SettingsPanel title="Dropdown">
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameContainer appState={{ authorized: false, status: AppStatus.IDLE }} width={DROPDOWN_WIDTH}>
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL_LOGIN,
                        domain: 'proton.me',
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    appState={{ status: AppStatus.SESSION_LOCKED }}
                    payload={{
                        action: DropdownAction.AUTOFILL_LOGIN,
                        domain: 'proton.me',
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL_LOGIN,
                        domain: 'proton.me',
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL_LOGIN,
                        domain: 'proton.me',
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL_LOGIN,
                        domain: 'proton.me',
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOSUGGEST_PASSWORD,
                        config: DEFAULT_RANDOM_PW_OPTIONS,
                        domain: 'proton.me',
                        copy: false,
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOSUGGEST_ALIAS,
                        domain: 'proton.me',
                        prefix: 'secret',
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>
            </div>
        </SettingsPanel>
    );
};
