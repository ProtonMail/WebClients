/* eslint-disable jsx-a11y/anchor-is-valid */
import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Interactive Focus Helper',
    parameters: {
        docs: {
            description: {
                component:
                    'Focus and interaction helper classes for interactive elements. Provides visual feedback on hover and focus states with different outline/pseudo-element strategies.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Interactive: Story = {
    render: () => (
        <a href="#" className="interactive p-2 border rounded">
            Focus me
        </a>
    ),
};

export const InteractivePseudo: Story = {
    render: () => (
        <a href="#" className="interactive-pseudo relative p-2">
            Focus me
        </a>
    ),
};

export const InteractivePseudoInset: Story = {
    render: () => (
        <div className="overflow-hidden border border-weak">
            <a href="#" className="interactive-pseudo-inset block w-full relative p-2">
                Focus me
            </a>
        </div>
    ),
};

export const InteractivePseudoProtrude: Story = {
    render: () => (
        <a href="#" className="interactive-pseudo-protrude interactive--no-background bg-primary relative">
            Focus me
        </a>
    ),
};

export const InteractiveNoBackground: Story = {
    render: () => (
        <a href="#" className="interactive interactive--no-background bg-none p-2 border rounded">
            Focus me
        </a>
    ),
};
