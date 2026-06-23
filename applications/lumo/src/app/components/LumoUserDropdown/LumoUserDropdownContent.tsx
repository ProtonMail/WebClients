import { useContext, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { AppSwitcher } from '@proton/components/containers/heading/AppSwitcher';
import { UserSection } from '@proton/components/containers/heading/UserDropdownContent';
import { UserDropdownContext } from '@proton/components/containers/heading/UserDropdownContext';
import { UserDropdownFooter } from '@proton/components/containers/heading/UserDropdownFooter';
import generateUID from '@proton/utils/generateUID';

import { useLumoAuthAction } from '../../hooks/useLumoAuthAction';

const LumoUserDropdownContent = () => {
    const [uid] = useState(generateUID('dropdown'));
    const { info, closeUserDropdown, onSignOut, isOpen, app, anchorRef, hasAppLinks, upgrade } =
        useContext(UserDropdownContext);
    const { trigger: triggerNativeAuthAction } = useLumoAuthAction();

    return (
        <Dropdown
            id={uid}
            className="userDropdown rounded-lg overflow-hidden"
            isOpen={isOpen}
            anchorRef={anchorRef}
            autoClose={false}
            onClose={closeUserDropdown}
            originalPlacement="bottom-end"
            adaptiveForTouchScreens={false}
            size={{
                height: DropdownSizeUnit.Dynamic,
                maxHeight: DropdownSizeUnit.Viewport,
                width: '17.25rem',
                maxWidth: '20rem',
            }}
        >
            <div className="pb-4">
                <UserSection info={info} upgrade={upgrade} />

                <div className="mb-4 px-4 flex flex-column gap-2">
                    <Button
                        shape="outline"
                        color="weak"
                        fullWidth
                        onClick={() => triggerNativeAuthAction('addaccount')}
                        data-testid="userdropdown:button:add-account"
                    >
                        {c('Action').t`Switch or add account`}
                    </Button>

                    <Button
                        shape="outline"
                        color="weak"
                        fullWidth
                        onClick={onSignOut}
                        data-testid="userdropdown:button:logout"
                    >
                        {c('Action').t`Sign out`}
                    </Button>
                </div>

                {hasAppLinks && <AppSwitcher app={app} hasBorder={false} />}

                <UserDropdownFooter />
            </div>
        </Dropdown>
    );
};

export default LumoUserDropdownContent;
