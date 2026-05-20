import { forwardRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonGroup, TopNavbarListItemButton, useActiveBreakpoint } from '@proton/components/index';
import { IcBuildings } from '@proton/icons/icons/IcBuildings';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

type Props = {
    onGetStarted: () => void;
    onDismiss?: () => void;
};

export const GetStartedButton = forwardRef<HTMLDivElement, Props>(({ onGetStarted, onDismiss }, ref) => {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <ButtonGroup className="mx-3" ref={ref}>
            <TopNavbarListItemButton
                as="button"
                shape="outline"
                color="weak"
                type="button"
                title={c('Title').t`Get started`}
                className={clsx('topnav-org-setup', viewportWidth['<=medium'] && 'button-for-icon')}
                onClick={onGetStarted}
                icon={<IcBuildings />}
                text={c('Title').t`Get started`}
            />
            {onDismiss ? (
                <Button
                    shape="outline"
                    color="weak"
                    type="button"
                    title={c('Title').t`Dismiss setup checklist`}
                    icon
                    onClick={onDismiss}
                >
                    <IcCross />
                </Button>
            ) : null}
        </ButtonGroup>
    );
});

GetStartedButton.displayName = 'GetStartedButton';
