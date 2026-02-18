import { useEffect, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { PopperPlacement } from '@proton/components/components/popper/interface';
import { allPopperPlacements } from '@proton/components/components/popper/utils';
import Spotlight from '@proton/components/components/spotlight/Spotlight';

type BorderRadius = 'xl' | 'lg' | 'md' | 'sm';

const sizeOptions = [
    { value: '2px', label: '2px' },
    { value: '8px', label: '8px' },
    { value: '14px', label: '14px' },
];

const borderRadiusOptions: { value: BorderRadius; label: string }[] = [
    { value: 'xl', label: 'xl' },
    { value: 'lg', label: 'lg' },
    { value: 'md', label: 'md (default)' },
    { value: 'sm', label: 'sm' },
];

const placementOptions = allPopperPlacements.map((placement) => ({
    value: placement,
    label: placement,
}));

const meta: Meta<typeof Spotlight> = {
    title: 'Components/Spotlight',
    component: Spotlight,
    parameters: {
        docs: {
            description: {
                component:
                    'A spotlight overlay anchored to an element for onboarding or feature highlights. Supports configurable placement, border radius, and close button.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Spotlight>;

export const Default: Story = {
    render: () => {
        const [targetSize, setTargetSize] = useState(sizeOptions[1].value);
        const [placement, setPlacement] = useState<PopperPlacement>(allPopperPlacements[0]);
        const [borderRadius, setBorderRadius] = useState<BorderRadius>('md');
        const [show, setShow] = useState(false);

        useEffect(() => {
            setTimeout(() => setShow(true), 500);
        }, []);

        const handleChangeSize = (size: string) => {
            setShow(false);
            setTargetSize(size);
            setTimeout(() => setShow(true), 100);
        };

        const handleChangePlacement = (p: PopperPlacement) => {
            setShow(false);
            setPlacement(p);
            setTimeout(() => setShow(true), 100);
        };

        const handleChangeBorderRadius = (br: BorderRadius) => {
            setShow(false);
            setBorderRadius(br);
            setTimeout(() => setShow(true), 100);
        };

        const style = {
            width: '8em',
            height: '8em',
            margin: '15em',
            padding: '1em',
            fontSize: targetSize,
        };

        return (
            <div className="p-7">
                <div className="mb-8 flex gap-4">
                    <div className="mr-8">
                        <strong className="block mb-4">Target size</strong>
                        <RadioGroup
                            name="target-size"
                            onChange={handleChangeSize}
                            value={targetSize}
                            options={sizeOptions}
                        />
                    </div>
                    <div className="mr-8">
                        <strong className="block mb-4">Placement</strong>
                        <RadioGroup
                            name="placement"
                            onChange={handleChangePlacement}
                            value={placement}
                            options={placementOptions}
                        />
                    </div>
                    <div className="mr-8">
                        <strong className="block mb-4">Border radius</strong>
                        <RadioGroup
                            name="border-radius"
                            value={borderRadius}
                            options={borderRadiusOptions}
                            onChange={handleChangeBorderRadius}
                        />
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center border">
                    <Spotlight
                        content="Content of the spotlight"
                        show={show}
                        originalPlacement={placement}
                        borderRadius={borderRadius}
                        key={placement}
                    >
                        <div className="border rounded flex items-center justify-center" style={style}>
                            Something to put spotlight on
                        </div>
                    </Spotlight>
                </div>
            </div>
        );
    },
};
