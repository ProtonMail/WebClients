import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Autocomplete from '@proton/components/components/autocomplete/Autocomplete';

const options = ['aaa', 'bbb', 'ccc'];

const meta: Meta<typeof Autocomplete> = {
    title: 'Components/Autocomplete',
    args: {
        id: 'autocomplete',
        value: '',
        onChange: () => {},
        onSelect: () => {},
        options,
        getData: (option: unknown) => option as string,
    },
    component: Autocomplete,
    parameters: {
        docs: {
            description: {
                component: 'Generally used to display a list of options based on the input value.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Autocomplete>;

export const Default: Story = {};
