import { memo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import clsx from '@proton/utils/clsx';

type Props = {
    currentStep: number;
    maxSteps: number;
    onBack?: () => void;
};

export const Header = memo(({ onBack, currentStep, maxSteps }: Props) => {
    return (
        <div className="relative p-4">
            {onBack ? (
                <Tooltip title={c('Action').t`Go back`}>
                    <Button className="shrink-0 absolute top-0 left-0" icon shape="ghost" onClick={onBack}>
                        <IcArrowLeft alt={c('Action').t`Go back`} />
                    </Button>
                </Tooltip>
            ) : null}

            <div className="flex align-center justify-center gap-2">
                {[...Array(maxSteps).keys()].map((i) => {
                    return (
                        <div
                            key={`step-${i}`}
                            className={clsx([i == currentStep ? 'bg-primary' : 'bg-strong', 'pr-8 h-2 rounded-full'])}
                        />
                    );
                })}
            </div>
        </div>
    );
});

Header.displayName = 'OnboardingHeader';
