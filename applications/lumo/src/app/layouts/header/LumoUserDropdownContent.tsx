import { type MouseEvent, useContext, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import AccountSessionsSwitcher from '@proton/components/containers/heading/AccountSessionsSwitcher';
import { UserDropdownContext } from '@proton/components/containers/heading/UserDropdownContext';
import { useActiveBreakpoint, useModalStateObject } from '@proton/components/index';
import { ForkType } from '@proton/shared/lib/authentication/fork';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import SettingsModal from '../../components/Modals/SettingsModal/SettingsModal';

const AddAccountButton = ({
    showAsButton = false,
    className,
    cta,
}: {
    showAsButton?: boolean;
    className?: string;
    cta?: string;
}) => {
    const { loginHref, onSwitchAccount } = useContext(UserDropdownContext);

    const commonProps = {
        href: loginHref,
        target: '_self',
        onClick: (event: MouseEvent<HTMLAnchorElement>) => onSwitchAccount(event, ForkType.LOGIN),
        'data-testid': 'userdropdown:button:add-account',
    };

    const copy = cta || c('Action').t`Add account`;

    if (showAsButton) {
        return (
            <ButtonLike as="a" shape="outline" color="weak" fullWidth className={clsx(className)} {...commonProps}>
                {copy}
            </ButtonLike>
        );
    }

    return (
        <a
            className={clsx(
                'text-no-decoration w-full relative',
                'interactive-pseudo-inset py-2',
                'hover:color-norm inline-flex items-center',
                className
            )}
            {...commonProps}
        >
            <LumoIcon name="Plus" className="shrink-0" />
            {copy}
        </a>
    );
};

const LumoUserDropdownContent = () => {
    const [uid] = useState(generateUID('lumo-dropdown'));
    const { viewportWidth } = useActiveBreakpoint();

    const {
        closeUserDropdown,
        onSignOut,
        onOpenSignoutAll,
        isOpen,
        anchorRef,
        accountSessions,
        showSwitchAccountButton,
        sessionOptions,
        onOpenHelpModal,
    } = useContext(UserDropdownContext);
    const settingsModal = useModalStateObject();

    return (
        <>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={closeUserDropdown}
                autoClose={false}
                originalPlacement="bottom-end"
                size={{
                    height: DropdownSizeUnit.Dynamic,
                    maxHeight: DropdownSizeUnit.Viewport,
                    width: '17.25rem',
                    maxWidth: '20rem',
                }}
                noCaret={false}
            >
                <div className="flex flex-column">
                    {/* {hasAppLinks && <AppSwitcher app={app} hasBorder={accountSessions.hasList} />} */}

                    {showSwitchAccountButton && accountSessions.hasList && (
                        <div className={clsx('mb-4', !viewportWidth['<=small'] && 'pb-4 border-bottom')}>
                            <AccountSessionsSwitcher
                                sessionOptions={sessionOptions}
                                sessions={accountSessions.state.value}
                                onSignOut={() => {
                                    closeUserDropdown();
                                    onOpenSignoutAll();
                                }}
                                addAccountButton={<AddAccountButton className="pl-5 pr-4 gap-4" />}
                                addAccountButtonDropdown={<AddAccountButton className="px-4 gap-2" />}
                            />
                        </div>
                    )}

                    <div className="flex flex-column flex-nowrap gap-2">
                        <Button
                            shape="ghost"
                            color="weak"
                            fullWidth
                            onClick={() => settingsModal.openModal(true)}
                            className="inline-flex items-center pl-5 pr-4 gap-4"
                        >
                            <LumoIcon name="Settings" className="shrink-0" />
                            {c('Action').t`Settings`}
                        </Button>

                        <Button
                            shape="ghost"
                            color="weak"
                            fullWidth
                            onClick={() => onOpenHelpModal()}
                            className="inline-flex items-center pl-5 pr-4 gap-4"
                        >
                            <LumoIcon name="MessageSquare" className="shrink-0" />
                            {c('Action').t`Help`}
                        </Button>

                        <Button
                            shape="ghost"
                            color="weak"
                            fullWidth
                            onClick={onSignOut}
                            className="inline-flex items-center pl-5 pr-4 gap-4"
                        >
                            <LumoIcon name="LogOut" className="shrink-0" />
                            {c('Action').t`Sign out`}
                        </Button>
                    </div>
                </div>
            </Dropdown>
            {settingsModal.render && <SettingsModal {...settingsModal.modalProps} />}
        </>
    );
};

export default LumoUserDropdownContent;
