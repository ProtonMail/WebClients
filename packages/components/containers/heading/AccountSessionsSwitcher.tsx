import type { ReactElement } from 'react';

import { c } from 'ttag';

import { Button, Scroll } from '@proton/atoms';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import Icon from '@proton/components/components/icon/Icon';
import type { ActiveSessionLite } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getSessionDisplayData } from '@proton/shared/lib/authentication/sessionDisplay';
import clsx from '@proton/utils/clsx';

interface Props {
    sessions: ActiveSessionLite[];
    onSignOut: () => void;
    sessionOptions?: {
        path?: string;
        target?: '_blank' | '_self';
    };
    addAccountButton?: ReactElement;
    addAccountButtonDropdown?: ReactElement;
}

const AccountSessionsSwitcher = ({
    sessions,
    onSignOut,
    sessionOptions,
    addAccountButton,
    addAccountButtonDropdown,
}: Props) => {
    const [, ...sessionsExceptSelf] = sessions;
    return (
        <div className="relative">
            <div className="flex justify-space-between flex-nowrap items-center mx-4 text-sm">
                <span className="text-semibold text-ellipsis">{c('Info').t`Other accounts`}</span>
                <SimpleDropdown
                    as={Button}
                    shape="ghost"
                    size="small"
                    type="button"
                    content={<Icon name="three-dots-vertical" size={4} />}
                    icon
                    data-testid="sessions:other-accounts:more"
                    hasCaret={false}
                >
                    <DropdownMenuButton
                        className="flex flex-nowrap items-center gap-2 text-left"
                        onClick={onSignOut}
                        data-testid="sessions:other-accounts:more:signout-all"
                    >
                        <Icon name="arrow-out-from-rectangle" className="shrink-0" />
                        {c('Action').t`Sign out of all accounts`}
                    </DropdownMenuButton>
                    {addAccountButtonDropdown}
                </SimpleDropdown>
            </div>
            <div className="flex overflow-hidden">
                <div className="w-full max-h-custom" style={{ '--max-h-custom': '14em' }}>
                    <Scroll>
                        <ul className="unstyled my-0 text-sm" data-testid="sessions:other-accounts">
                            {sessionsExceptSelf.map((session) => {
                                const sessionDisplayData = getSessionDisplayData(session);
                                return (
                                    <li className="unstyled my-0" key={sessionDisplayData.localID}>
                                        <a
                                            href={`${sessionDisplayData.path}${sessionOptions?.path || ''}`}
                                            type="button"
                                            target={sessionOptions?.target || '_blank'}
                                            className="color-inherit px-4 py-1.5 flex gap-2 items-start items-center w-full text-left relative interactive-pseudo-inset text-no-decoration"
                                        >
                                            <span
                                                className={clsx(
                                                    'text-sm rounded p-1 inline-block relative shrink-0 user-initials flex items-center justify-center',
                                                    'border'
                                                )}
                                                aria-hidden="true"
                                            >
                                                <span className="m-auto">{sessionDisplayData.initials}</span>
                                            </span>

                                            <div className="flex-1 mt-custom">
                                                <div className="text-ellipsis">
                                                    <span data-testid="sessions:item-username">
                                                        {sessionDisplayData.name}
                                                    </span>
                                                    {sessionDisplayData.status.isAdminSignedIntoMember && (
                                                        <span className="color-weak">
                                                            {' - '}
                                                            {c('Info').t`Member`}
                                                        </span>
                                                    )}
                                                </div>
                                                {sessionDisplayData.email && (
                                                    <div
                                                        className="text-ellipsis color-weak"
                                                        data-testid="sessions:item-email"
                                                    >
                                                        {sessionDisplayData.email}
                                                    </div>
                                                )}
                                            </div>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                        {addAccountButton}
                    </Scroll>
                </div>
            </div>
        </div>
    );
};

export default AccountSessionsSwitcher;
