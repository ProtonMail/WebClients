import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import './CategoriesOnboardingSpotlights.scss';

interface SpotlightContentProps {
    title: string;
    description: string;
    /** Starts at 0 */
    step: number;
    onSkip: () => void;
    onNext: () => void;
}

const Circle = () => <div className="categories-onboarding-circle rounded-full border inset-0"></div>;
const Long = () => <div className="categories-onboarding-long rounded-full bg-primary"></div>;

const SpotlightContent = ({ title, description, step, onSkip, onNext }: SpotlightContentProps) => {
    return (
        <div>
            <span className="mb-4 flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (i === step ? <Long key={i} /> : <Circle key={i} />))}
            </span>
            <h2 className="mb-1 text-rg text-semibold">{title}</h2>
            <p className="m-0 mb-4 text-rg color-weak">{description}</p>
            <div className="flex w-full justify-space-between">
                <Button onClick={onNext} color="norm">{c('Actions').t`Next`}</Button>
                <Button onClick={onSkip} shape="ghost" color="weak">
                    {c('Actions').t`Skip`}
                </Button>
            </div>
        </div>
    );
};

export const SpotlightMessage = () => {
    return (
        <SpotlightContent
            title={c('Title').t`New messages`}
            description={c('Description')
                .t`A blue dot appears when a category has unread messages since your last visit. Hover to see the count.`}
            step={0}
            onSkip={() => {}}
            onNext={() => {}}
        />
    );
};

export const SpotlightCategorize = () => {
    return (
        <SpotlightContent
            title={c('Title').t`Personalize your Categories`}
            description={c('Description')
                .t`Right-click an email and select “Move to,” or drag and drop it into another category. Similar emails will be sorted there automatically in the future.`}
            step={1}
            onSkip={() => {}}
            onNext={() => {}}
        />
    );
};

export const SpotlightCustomize = () => {
    return (
        <SpotlightContent
            title={c('Title').t`You're in control`}
            description={c('Description')
                .t`Add or remove categories, manage notifications, or turn them off entirely - anytime in Settings.`}
            step={2}
            onSkip={() => {}}
            onNext={() => {}}
        />
    );
};
