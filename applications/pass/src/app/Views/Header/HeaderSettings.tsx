import { memo } from 'react';

import type { HeaderProps } from 'proton-pass-web/app/Views/Header/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import CoreHeader from '@proton/components/components/header/Header';
import Icon from '@proton/components/components/icon/Icon';
import Hamburger from '@proton/components/components/sidebar/Hamburger';
import { useNavigate } from '@proton/pass/components/Navigation/NavigationActions';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';

export const HeaderSettings = memo(({ sidebarExpanded, sidebarToggle }: HeaderProps) => {
    const navigate = useNavigate();

    return (
        <CoreHeader className="border-bottom border-weak h-auto p-2">
            <div className="flex items-center gap-2">
                <Hamburger expanded={sidebarExpanded} onToggle={sidebarToggle} />
                <Button
                    className="shrink-0"
                    size="small"
                    icon
                    pill
                    shape="solid"
                    onClick={() => navigate(getLocalPath())}
                >
                    <Icon className="modal-close-icon" name="arrow-left" size={3.5} alt={c('Action').t`Close`} />
                </Button>
                <h5 className="text-bold">{c('Title').t`Settings`}</h5>
            </div>
        </CoreHeader>
    );
});

HeaderSettings.displayName = 'HeaderSettingsMemo';
