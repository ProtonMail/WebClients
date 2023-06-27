import type { ReactNode, VFC } from 'react';

import { Card } from '@proton/atoms/Card';
import type { SafeLoginItem } from '@proton/pass/types';
import { WorkerStatus } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string';

import { DROPDOWN_WIDTH } from '../../../content/constants';
import { DropdownSwitch } from '../../../content/injections/apps/dropdown/components/DropdownSwitch';
import { DropdownAction } from '../../../content/types';

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

const MockIFrameContainer: VFC<{ children: ReactNode }> = ({ children }) => (
    <div
        style={{
            width: '100%',
            maxWidth: DROPDOWN_WIDTH,
            overflow: 'hidden',
            background: '#191927',
            boxShadow: '0 2px 10px rgb(0 0 0 / 0.3)',
            borderRadius: 12,
            marginBottom: 12,
        }}
    >
        {children}
    </div>
);

export const DropdownDebug: VFC = () => {
    return (
        <Card rounded className="mb-4 p-3 relative">
            <strong className="color-norm block">Dropdown</strong>
            <hr className="mt-2 mb-4 border-weak" />
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameContainer>
                    <DropdownSwitch loggedIn={false} status={WorkerStatus.IDLE} state={null} />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <DropdownSwitch
                        loggedIn={false}
                        status={WorkerStatus.READY}
                        state={{
                            action: DropdownAction.AUTOFILL,
                            needsUpgrade: false,
                            items: [],
                        }}
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <DropdownSwitch
                        loggedIn={false}
                        status={WorkerStatus.LOCKED}
                        state={{
                            action: DropdownAction.AUTOFILL,
                            needsUpgrade: false,
                            items: [],
                        }}
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <DropdownSwitch
                        loggedIn
                        status={WorkerStatus.READY}
                        state={{
                            action: DropdownAction.AUTOFILL,
                            needsUpgrade: false,
                            items: [LOGIN_ITEMS[1]],
                        }}
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <DropdownSwitch
                        loggedIn
                        status={WorkerStatus.READY}
                        state={{
                            action: DropdownAction.AUTOFILL,
                            needsUpgrade: true,
                            items: [LOGIN_ITEMS[0]],
                        }}
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <DropdownSwitch
                        loggedIn
                        status={WorkerStatus.READY}
                        state={{
                            action: DropdownAction.AUTOFILL,
                            needsUpgrade: false,
                            items: LOGIN_ITEMS,
                        }}
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <DropdownSwitch
                        loggedIn
                        status={WorkerStatus.READY}
                        state={{ action: DropdownAction.AUTOSUGGEST_PASSWORD }}
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <DropdownSwitch
                        loggedIn
                        status={WorkerStatus.READY}
                        state={{ action: DropdownAction.AUTOSUGGEST_ALIAS, domain: 'proton.me', prefix: 'secret' }}
                    />
                </MockIFrameContainer>
            </div>
        </Card>
    );
};
