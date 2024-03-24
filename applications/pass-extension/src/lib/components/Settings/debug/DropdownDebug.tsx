import type { FC } from 'react';

import { DROPDOWN_WIDTH } from 'proton-pass-extension/app/content/constants.static';
import { Dropdown } from 'proton-pass-extension/app/content/injections/apps/dropdown/Dropdown';
import { DropdownAction } from 'proton-pass-extension/app/content/types';

import { DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/lib/password/constants';
import type { SafeLoginItem } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { SettingsPanel } from '../SettingsPanel';
import { MockIFrameContainer } from './MockIFrameContainer';

const LOGIN_ITEMS: SafeLoginItem[] = [
    {
        name: 'Netflix account',
        username: 'netflix+nobody@proton.me',
        shareId: uniqueId(),
        itemId: uniqueId(),
        url: 'https://netflix.com',
    },
    {
        name: 'Proton credentials',
        username: 'nobody@proton.me',
        shareId: uniqueId(),
        itemId: uniqueId(),
    },
];

export const DropdownDebug: FC = () => {
    return (
        <SettingsPanel title="Dropdown">
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameContainer appState={{ loggedIn: false, status: AppStatus.IDLE }} width={DROPDOWN_WIDTH}>
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL,
                        hostname: 'proton.me',
                        needsUpgrade: false,
                        items: [],
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    appState={{ status: AppStatus.LOCKED }}
                    payload={{
                        action: DropdownAction.AUTOFILL,
                        hostname: 'proton.me',
                        needsUpgrade: false,
                        items: [],
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL,
                        hostname: 'proton.me',
                        needsUpgrade: false,
                        items: [LOGIN_ITEMS[1]],
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL,
                        hostname: 'proton.me',
                        needsUpgrade: true,
                        items: [LOGIN_ITEMS[0]],
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOFILL,
                        hostname: 'proton.me',
                        needsUpgrade: false,
                        items: LOGIN_ITEMS,
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOSUGGEST_PASSWORD,
                        config: DEFAULT_RANDOM_PW_OPTIONS,
                        hostname: 'proton.me',
                    }}
                    width={DROPDOWN_WIDTH}
                >
                    <Dropdown />
                </MockIFrameContainer>

                <MockIFrameContainer
                    payload={{
                        action: DropdownAction.AUTOSUGGEST_ALIAS,
                        hostname: 'proton.me',
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
