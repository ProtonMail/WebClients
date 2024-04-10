import { type FC } from 'react';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';

export type LearnMoreProps = {
    image: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaAction: () => void;
};

export const LearnMoreCard: FC<LearnMoreProps> = ({ image, title, description, ctaLabel, ctaAction }) => (
    <div className="bg-weak rounded-xl text-lg border border-norm overflow-hidden p-6 flex gap-6 space-between">
        <img src={image} alt="" className="w-full" />
        <div className="flex flex-column space-between w-full gap-5">
            <span className="text-left text-rg color-strong text-bold">{title}</span>
            <span className="text-left text-sm color-weak">{description}</span>
            <InlineLinkButton onClick={ctaAction}>{ctaLabel}</InlineLinkButton>
        </div>
    </div>
);
