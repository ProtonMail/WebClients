import type { Meta, StoryObj } from '@storybook/react-webpack5';

import LabelStack from '@proton/components/components/labelStack/LabelStack';

const labelList = [
    { color: '#8080FF', title: 'electron' },
    { color: '#EC3E7C', title: 'muon' },
    { color: '#DB60D6', title: 'tau' },
    { color: '#415DF0', title: 'neutrino' },
    { color: '#179FD9', title: 'z boson' },
    { color: '#1DA583', title: 'w boson' },
    { color: '#3CBB3A', title: 'quark' },
    { color: '#B4A40E', title: 'higgs' },
    { color: '#936D58', title: 'photon' },
    { color: '#F78400', title: 'gluon' },
].map(({ color, title }) => ({
    title,
    name: title,
    color,
}));

const labelListWithHandlers = labelList.map((label) => ({
    ...label,
    onClick() {
        alert(`You clicked on "${label.name}"`);
    },
    onDelete() {
        alert(`You deleted "${label.name}"`);
    },
}));

const meta: Meta<typeof LabelStack> = {
    title: 'Components/Label Stack',
    args: {
        labels: labelList,
    },
    component: LabelStack,
    parameters: {
        docs: {
            description: {
                component:
                    'Displays a list of colored labels with an embedded look and feel. Supports click handlers, delete buttons, stacking, max count, and dropdown display.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof LabelStack>;

export const Default: Story = {};

export const Clickable: Story = {
    args: {
        labels: labelListWithHandlers,
    },
};

export const WithDelete: Story = {
    args: {
        labels: labelListWithHandlers,
        showDelete: true,
    },
};

export const Stacked: Story = {
    render: () => (
        <div className="flex justify-space-between">
            <LabelStack labels={labelList} isStacked leftToRight />
            <LabelStack labels={labelList} isStacked />
        </div>
    ),
};

export const MaxNumber: Story = {
    args: {
        maxNumber: 5,
    },
};

export const WithDropdown: Story = {
    args: {
        labels: labelListWithHandlers,
        showDropDown: true,
    },
};
