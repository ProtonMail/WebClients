import { useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import Href from '@proton/atoms/Href/Href';
import { ButtonGroup, Checkbox, Icon, RadioGroup } from '@proton/components/index';

import Banner, { BannerVariants } from './Banner';
import mdx from './Banner.mdx';

export default {
    component: Banner,
    title: 'components/Banner',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <Banner
        action={<Button onClick={() => alert('Action clicked')}>Action</Button>}
        link={<Href href="#">Learn more</Href>}
    >
        Text content
    </Banner>
);

export const StoryWithCanvas = () => <div>I am a story with a canvas</div>;

type BannerProps = React.ComponentProps<typeof Banner>;

const variants: Required<BannerProps>['variant'][] = Object.values(BannerVariants);

const toggles = ['dismissable', 'link', 'action'] as const;

export const Sandbox = () => {
    const [selectedVariant, setSelectedVariant] = useState<Required<BannerProps>['variant']>('norm');
    const [selectedToggles, setSelectedToggles] = useState(toggles.map(() => false));

    const banner = (
        <Banner
            variant={selectedVariant}
            onDismiss={selectedToggles[toggles.indexOf('dismissable')] ? () => alert('Dismissed') : undefined}
            action={
                selectedToggles[toggles.indexOf('action')] ? (
                    <Button onClick={() => alert('Action clicked')}>Action</Button>
                ) : undefined
            }
            link={selectedToggles[toggles.indexOf('link')] ? <Href href="#">Learn more</Href> : undefined}
        >
            Something happened that you should know about.
        </Banner>
    );

    return (
        <div className="py-7">
            <div className="flex flex-row mb-4 gap-4">
                <div>
                    <strong className="block mb-4">Variant</strong>
                    <RadioGroup
                        name="selected-variant"
                        onChange={(v) => setSelectedVariant(v)}
                        value={selectedVariant}
                        options={variants.map((variant) => ({ value: variant, label: variant }))}
                    />
                </div>
                <div>
                    <strong className="block mb-4">Toggles</strong>
                    {toggles.map((prop, i) => {
                        return (
                            <div className="mb-2" key={i}>
                                <Checkbox
                                    checked={selectedToggles[i]}
                                    onChange={({ target: { checked } }) => {
                                        setSelectedToggles(
                                            selectedToggles.map((oldValue, otherIndex) =>
                                                otherIndex === i ? checked : oldValue
                                            )
                                        );
                                    }}
                                >
                                    {prop}
                                </Checkbox>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div>{banner}</div>
        </div>
    );
};

const getRandomAction = () =>
    Math.random() > 0.2 ? <Button onClick={() => alert('Action clicked')}>Action</Button> : undefined;

const getRandomLink = () => (Math.random() > 0.4 ? <Href href="#">Learn more</Href> : undefined);

const getRandomText = () => {
    const texts = [
        "Here's some important information.",
        'Check out this feature to stay informed.',
        'Be sure to follow the latest updates.',
        "Don't miss out on these details.",
        'Take action today to avoid issues.',
    ];
    return texts[Math.floor(Math.random() * texts.length)];
};

const bannerConfigs = [
    { variant: BannerVariants.NORM, onDismiss: () => alert('Dismissed') },
    { variant: BannerVariants.INFO },
    { variant: BannerVariants.INFO_OUTLINE, onDismiss: () => alert('Dismissed') },
    { variant: BannerVariants.SUCCESS },
    { variant: BannerVariants.SUCCESS_OUTLINE, onDismiss: () => alert('Dismissed') },
    { variant: BannerVariants.WARNING },
    { variant: BannerVariants.WARNING_OUTLINE },
    { variant: BannerVariants.DANGER },
    { variant: BannerVariants.DANGER_OUTLINE, onDismiss: () => alert('Dismissed') },
];

export const All = () => (
    <div className="flex flex-column gap-4">
        {bannerConfigs.map((config, index) => (
            <Banner
                key={index}
                {...config}
                action={Math.random() > 0.5 ? getRandomAction() : undefined}
                link={Math.random() > 0.5 ? getRandomLink() : undefined}
                children={getRandomText()}
            />
        ))}
    </div>
);

export const TextContent = () => (
    <Banner variant="danger-outline">
        <span className="color-danger text-bold">VPN Plus expires in 2 days.</span> Don't lose access to your premium
        VPN features. Enable auto-renew today.
    </Banner>
);

export const Icons = () => (
    <Banner variant="warning" icon={<Icon name="eye" />}>
        Text content
    </Banner>
);

export const Action = () => (
    <Banner action={<Button onClick={() => alert('Action clicked')}>Action</Button>}>
        Something happened that you should know about.
    </Banner>
);

export const DoubleAction = () => (
    <Banner
        action={
            <ButtonGroup>
                <Button onClick={() => alert('Action clicked')}>First Action</Button>
                <Button onClick={() => alert('Action clicked')}>Second Action</Button>
            </ButtonGroup>
        }
    >
        Something happened that you should know about.
    </Banner>
);

export const Link = () => (
    <Banner variant="warning" link={<Href href="#">Learn more</Href>}>
        Something happened that you should know about.
    </Banner>
);

export const Dismissable = () => (
    <Banner variant="danger-outline" onDismiss={() => alert('Dismissed')}>
        Something happened that you should know about.
    </Banner>
);
