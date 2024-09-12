import { type FC } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { default as DropdownMenuButtonCore } from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownMenuButtonLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import clsx from '@proton/utils/clsx';

import './OnboardingButton.scss';

export const OnboardingButton: FC = () => {
    const { navigate } = useNavigation();
    const { acknowledge } = useOnboarding();

    return (
        <div className="pass-onboarding-button relative shrink-0 mx-3">
            <div
                className={clsx(
                    'pass-onboarding-button--gradient',
                    useRouteMatch(getLocalPath('onboarding')) && 'pass-onboarding-button--active'
                )}
            >
                <DropdownMenuButtonCore className="py-3" onClick={() => navigate(getLocalPath('onboarding'))}>
                    <DropdownMenuButtonLabel icon="star" label={c('Action').t`Get Started`} />
                </DropdownMenuButtonCore>

                <div className="absolute flex items-center h-full right-0 top-0 flex items-center shrink-0 flex-nowrap color-weak">
                    <Button
                        icon
                        pill
                        size="small"
                        color="weak"
                        onClick={acknowledge}
                        shape="ghost"
                        title={c('Action').t`Close`}
                    >
                        <Icon name="cross" alt={c('Action').t`Close`} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
