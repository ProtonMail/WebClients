import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { DropdownMenu, Icon } from '@proton/components/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { useFeedbackLinks } from '@proton/pass/components/Menu/hooks';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import clsx from '@proton/utils/clsx';

import { useAuthService } from '../../Context/AuthServiceProvider';

export const SidebarMenu: FC = () => {
    const authService = useAuthService();
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);

    const feedbackLinks = useFeedbackLinks();

    return (
        <DropdownMenu>
            <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

            <DropdownMenuButton
                onClick={() => {}}
                label={c('Label').t`Settings`}
                labelClassname="flex-item-fluid"
                icon={'cog-wheel'}
            />

            <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

            <Submenu submenuIcon="bug" submenuLabel={c('Action').t`Feedback`} linkItems={feedbackLinks} />

            <DropdownMenuButton
                onClick={() => authService.logout({ soft: false })}
                label={c('Action').t`Sign out`}
                icon="arrow-out-from-rectangle"
            />

            <div className="flex flex-align-items-center flex-justify-space-between flex-nowrap gap-2 py-2 px-4">
                <span
                    className={clsx(
                        'flex flex-align-items-center flex-nowrap',
                        passPlan === UserPassPlan.PLUS && 'ui-orange'
                    )}
                >
                    <Icon name="star" className="mr-3" color="var(--interaction-norm)" />
                    <span className="text-left">
                        <div className="text-sm text-ellipsis">{user?.Email}</div>
                        <div className="text-sm" style={{ color: 'var(--interaction-norm)' }}>
                            {planDisplayName}
                        </div>
                    </span>
                </span>
            </div>
        </DropdownMenu>
    );
};
