import type { VFC } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Card } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './OnboardingSuggestionContainer.scss';

export type OnboardingSuggestionContainerProps = {
    title?: string;
    icon?: IconName;
    iconPath?: string;
    className?: string;
    children?: React.ReactNode;
};

export const OnboardingSuggestionContainer: VFC<OnboardingSuggestionContainerProps> = ({
    title,
    icon,
    iconPath,
    className: classNameProp,
    children,
}) => {
    return (
        <Card
            className={clsx(
                'flex no-wrap flex-column flex-align-items-start p-6 gap-3 border-none rounded-xl',
                classNameProp
            )}
        >
            <div className="flex flex-align-items-center flex-nowrap gap-2">
                <div
                    className="pass-onboarding-icon h-custom w-custom rounded-50 text-center mr-3 relative"
                    aria-hidden="true"
                >
                    {icon && <Icon name={icon} className="absolute absolute-center" color="var(--interaction-norm)" />}
                    {iconPath && (
                        <img
                            src={iconPath}
                            className="h-custom pass-onboarding-icon__img absolute absolute-center"
                            alt=""
                        />
                    )}
                </div>
                <h3 className="text-bold">{c('Info').t`${title}`}</h3>
            </div>
            {children}
        </Card>
    );
};
