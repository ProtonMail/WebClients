import { type FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';

export type LearnMoreProps = {
    image: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaAction: () => void;
};

export const LearnMoreCard: FC<LearnMoreProps> = ({ image, title, description, ctaLabel, ctaAction }) => (
    <Card rounded className="text-lg overflow-hidden flex gap-4 md:gap-6 flex-nowrap md:flex-wrap items-center">
        <div className="w-1/3 md:w-full shrink-0">
            <div className="ratio-2/1 relative">
                <img src={image} alt="" className="absolute w-full h-full object-contain" />
            </div>
        </div>
        <div className="flex flex-column w-full gap-4">
            <span className="text-left text-rg color-strong text-bold">{title}</span>
            <span className="text-left text-sm color-weak">{description}</span>
            <Button shape="underline" color="norm" size="small" className="text-left text-sm" onClick={ctaAction}>
                {ctaLabel}
            </Button>
        </div>
    </Card>
);
