import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Transforms',
    parameters: {
        docs: {
            description: {
                component:
                    'CSS transform utility classes. Includes mirror (horizontal flip), rotateX-180, rotateZ-90, and rotateZ-270.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

const demoItemClasses = 'user-select flex items-center p-4 justify-center bg-primary rounded-sm text-center';
const demoContainerClasses = 'border rounded w-full relative flex p-4 items-center justify-space-around';

export const Mirror: Story = {
    render: () => (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} mirror`} style={{ width: '5rem', height: '5rem' }}>
                Mirror
            </div>
        </div>
    ),
};

export const RotateX180: Story = {
    render: () => (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} rotateX-180`} style={{ height: '5rem' }}>
                RotateX(180deg)
            </div>
        </div>
    ),
};

export const RotateZ90: Story = {
    render: () => (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} rotateZ-90`} style={{ height: '5rem' }}>
                RotateZ(90deg)
            </div>
        </div>
    ),
};

export const RotateZ270: Story = {
    render: () => (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} rotateZ-270`} style={{ height: '5rem' }}>
                RotateZ(270deg)
            </div>
        </div>
    ),
};
