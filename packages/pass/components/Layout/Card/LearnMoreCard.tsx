import { type FC } from 'react';

import { Button } from '@proton/atoms';
import { Card } from '@proton/atoms/Card';
import { Icon, type IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

export type LearnMoreProps = {
    ctaLabel: string;
    description: string;
    icon: IconName;
    iconClassName?: string;
    title: string;
    ctaAction: () => void;
};

export const LearnMoreCard: FC<LearnMoreProps> = ({ icon, iconClassName, title, description, ctaLabel, ctaAction }) => (
    <Card rounded className="text-lg overflow-hidden flex gap-4 md:gap-4 flex-nowrap md:flex-wrap items-center">
        <Icon name={icon} size={8} color="var(--interaction-norm)" className={clsx('shrink-0', iconClassName)} />
        <div className="flex flex-column w-full gap-4">
            <span className="text-left text-rg color-strong text-bold">{title}</span>
            <span className="text-left text-sm color-weak">{description}</span>
            <Button shape="underline" color="norm" size="small" className="text-left text-sm" onClick={ctaAction}>
                {ctaLabel}
            </Button>
        </div>
    </Card>
);
