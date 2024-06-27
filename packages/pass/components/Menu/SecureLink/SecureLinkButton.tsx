import { type FC } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import clsx from '@proton/utils/clsx';

export const SecureLinkButton: FC = () => {
    const { navigate } = useNavigation();
    const isActive = useRouteMatch(getLocalPath('secure-links'));

    return (
        <DropdownMenuButton
            icon="link"
            className={clsx('rounded', isActive && 'color-primary bg-weak')}
            label={c('Action').t`Secure links`}
            onClick={() => navigate(getLocalPath('secure-links'))}
            parentClassName="mx-3"
        />
    );
};
