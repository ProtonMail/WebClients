import type { VFC } from 'react';
import { type ReactNode } from 'react';

import { Card } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './OnboardingPanel.scss';

export type OnboardingPanelProps = {
    title?: string;
    icon?: IconName;
    iconPath?: string;
    className?: string;
    children?: ReactNode;
};

export const OnboardingPanel: VFC<OnboardingPanelProps> = ({ title, icon, iconPath, className, children }) => {
    return (
        <Card
            background={false}
            bordered={false}
            className={clsx(
                'ui-login pass-onboarding-panel flex flex-column flex-align-items-start p-6 gap-3 border-none',
                className
            )}
        >
            <div className="flex flex-align-items-center flex-nowrap">
                <div className="pass-onboarding-icon h-custom w-custom rounded-50 text-center mr-3 relative">
                    {icon && <Icon name={icon} className="absolute absolute-center" color="var(--interaction-norm)" />}
                    {iconPath && (
                        <img
                            src={iconPath}
                            className="h-custom pass-onboarding-icon--img absolute absolute-center"
                            alt=""
                        />
                    )}
                </div>
                <h4 className="text-bold">{title}</h4>
            </div>
            {children}
        </Card>
    );
};
