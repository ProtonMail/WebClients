import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';

const meta: Meta = {
    title: 'CSS Utilities/Hiding Disabling Content',
    parameters: {
        docs: {
            description: {
                component:
                    'Utilities for hiding, disabling, and managing content visibility. Includes hidden, empty:hidden, visibility-hidden, sr-only (screen-reader only), and pointer-events-none.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Hidden: Story = {
    render: () => (
        <div className="p-7 bg-weak">
            Here are two hidden elements:
            <p hidden>I'm hidden</p>
            <p className="hidden">I'm also hidden</p>
        </div>
    ),
};

export const HiddenEmpty: Story = {
    render: () => (
        <div className="p-7 bg-weak">
            Here are two elements, one empty, one not empty:
            <p className="empty:hidden m-0">I'm not empty</p>
            <p className="empty:hidden m-0">{/* I'm empty */}</p>
        </div>
    ),
};

export const VisibilityHidden: Story = {
    render: () => (
        <div className="p-7 bg-weak">
            Here is one hidden element
            <span className="visibility-hidden">I'm hidden but still need my space</span>
            which still keeps its space
        </div>
    ),
};

export const Screenreaders: Story = {
    render: () => (
        <div className="p-7 bg-weak">
            <Button>
                <Icon name="emoji" />
                <span className="sr-only">I'm hidden but will be vocalized when using a screen reader</span>
            </Button>
        </div>
    ),
};

export const PointerEventsNone: Story = {
    render: () => (
        <div className="p-7 bg-weak">
            <Button className="pointer-events-none mr-8">Hover me (pointer-events-none)</Button>
            <Button>Hover me (default)</Button>
        </div>
    ),
};
