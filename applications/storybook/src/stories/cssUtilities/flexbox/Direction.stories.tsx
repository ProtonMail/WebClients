import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
    title: 'CSS Utilities/Flexbox/Direction',
    parameters: {
        docs: {
            description: {
                component:
                    'Defines the direction that flex items are placed in the container: `row` (default, left to right), `row-reverse`, `column` (top to bottom), `column-reverse`. Also controls wrapping behavior with `flex-wrap` and `flex-nowrap`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const FlexRow: Story = {
    render: () => (
        <div className="flex flex-row rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const FlexRowReverse: Story = {
    render: () => (
        <div className="flex flex-row-reverse rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const FlexColumn: Story = {
    render: () => (
        <div className="flex flex-column rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const FlexColumnReverse: Story = {
    render: () => (
        <div className="flex flex-column-reverse rounded overflow-hidden border">
            <div className="bg-primary p-4">div</div>
            <span className="bg-primary p-4">span</span>
            <em className="bg-primary p-4">em</em>
        </div>
    ),
};

export const FlexWrap: Story = {
    render: () => (
        <>
            <h3>Default:</h3>
            <div className="flex rounded overflow-hidden border">
                <div className="bg-primary p-4 w-1/5">div</div>
                <span className="bg-primary p-4 w-1/5">span</span>
                <em className="bg-primary p-4 w-1/5">em</em>
                <div className="bg-primary p-4 w-1/5">div</div>
                <span className="bg-primary p-4 w-1/5">span</span>
                <em className="bg-primary p-4 w-1/5">em</em>
            </div>
        </>
    ),
};

export const FlexNowrap: Story = {
    render: () => (
        <>
            <h3>No Wrap:</h3>
            <div className="flex flex-nowrap rounded overflow-hidden border">
                <div className="bg-primary p-4 w-1/5">div</div>
                <span className="bg-primary p-4 w-1/5">span</span>
                <em className="bg-primary p-4 w-1/5">em</em>
                <div className="bg-primary p-4 w-1/5">div</div>
                <span className="bg-primary p-4 w-1/5">span</span>
                <em className="bg-primary p-4 w-1/5">em</em>
            </div>
        </>
    ),
};
