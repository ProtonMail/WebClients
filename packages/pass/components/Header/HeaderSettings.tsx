import { memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import CoreHeader from '@proton/components/components/header/Header';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

import { MenuDropdown } from '../Menu/Dropdown/MenuDropdown';
import { useNavigate } from '../Navigation/NavigationActions';
import { getLocalPath } from '../Navigation/routing';
import type { HeaderProps } from './types';

export const HeaderSettings = memo((props: HeaderProps) => {
    const navigate = useNavigate();

    return (
        <CoreHeader className="border-bottom border-weak h-auto p-2">
            <div className="flex items-center gap-2">
                <MenuDropdown {...props} />
                <Button
                    className="shrink-0"
                    size="small"
                    icon
                    pill
                    shape="solid"
                    onClick={() => navigate(getLocalPath())}
                >
                    <IcArrowLeft className="modal-close-icon" size={3.5} alt={c('Action').t`Close`} />
                </Button>
                <h5 className="text-bold">{c('Title').t`Settings`}</h5>
            </div>
        </CoreHeader>
    );
});

HeaderSettings.displayName = 'HeaderSettingsMemo';
