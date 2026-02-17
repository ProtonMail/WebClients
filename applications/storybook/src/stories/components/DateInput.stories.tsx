import { useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import DateInput from '@proton/components/components/input/DateInput';
import { addDays } from '@proton/shared/lib/date-fns-utc';

const meta: Meta<typeof DateInput> = {
    title: 'Components/Date Input',
    component: DateInput,
    parameters: {
        docs: {
            description: {
                component:
                    'A date input with an integrated mini calendar dropdown. Supports min/max date constraints, value reset prevention, week number display, and custom placeholder formatting.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DateInput>;

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState<Date | undefined>(new Date());

        return <DateInput value={value} onChange={setValue} />;
    },
};

export const WithMinAndMax: Story = {
    render: () => {
        const currentDate = new Date();
        const [value, setValue] = useState<Date | undefined>(currentDate);
        const min = addDays(currentDate, -3);
        const max = addDays(currentDate, 3);

        return <DateInput value={value} onChange={setValue} min={min} max={max} />;
    },
};

export const WithPreventValueReset: Story = {
    render: () => {
        const currentDate = new Date();
        const [value, setValue] = useState<Date | undefined>(currentDate);
        const min = addDays(currentDate, -3);
        const max = addDays(currentDate, 3);

        const error = useMemo(() => {
            if (value && value < min) {
                return 'Choose a date in the future';
            }
            if (value && value > max) {
                return 'Choose a date in the past';
            }
            return undefined;
        }, [value]);

        return <DateInput value={value} onChange={setValue} min={min} max={max} preventValueReset error={error} />;
    },
};

export const WithWeekNumbers: Story = {
    render: () => {
        const [value, setValue] = useState<Date | undefined>(new Date());

        return <DateInput value={value} onChange={setValue} displayWeekNumbers />;
    },
};

export const CustomWeekStart: Story = {
    render: () => {
        const [value, setValue] = useState<Date | undefined>(new Date());

        return <DateInput value={value} onChange={setValue} weekStartsOn={1} />;
    },
};

export const WithoutPrefixPlaceholder: Story = {
    render: () => {
        const [value, setValue] = useState<Date | undefined>(undefined);

        return <DateInput value={value} onChange={setValue} prefixPlaceholder={false} />;
    },
};

export const CustomPlaceholder: Story = {
    render: () => {
        const [value, setValue] = useState<Date | undefined>(undefined);

        return <DateInput value={value} onChange={setValue} placeholder="Pick a date..." />;
    },
};
