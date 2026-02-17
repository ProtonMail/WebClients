import type { Meta, StoryObj } from '@storybook/react-webpack5';

import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';

const meta: Meta<typeof InputFieldStacked> = {
    title: 'Components/Input Field Stacked',
    component: InputFieldStacked,
    parameters: {
        docs: {
            description: {
                component:
                    'A wrapper around InputField that mimics Pass-like stacked inputs. Supports icons, bigger variant, and grouping multiple fields together.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof InputFieldStacked>;

export const Default: Story = {
    render: () => (
        <InputFieldStacked icon="alias" classname="mb-2">
            <InputFieldTwo
                type="text"
                label="Title"
                inputClassName="rounded-none"
                placeholder="e.g., Amazon, eBay, Etsy"
                autoFocus
                unstyled
            />
        </InputFieldStacked>
    ),
};

export const Bigger: Story = {
    render: () => (
        <InputFieldStacked isBigger classname="mb-2">
            <InputFieldTwo
                type="text"
                label="Title"
                inputClassName="text-bold rounded-none"
                placeholder="e.g., Amazon, eBay, Etsy"
                autoFocus
                unstyled
            />
        </InputFieldStacked>
    ),
};

export const Group: Story = {
    render: () => (
        <InputFieldStackedGroup classname="mb-4">
            <InputFieldStacked isGroupElement icon="alias">
                <InputFieldTwo label="Your alias" type="text" unstyled inputClassName="rounded-none" value="Test" />
            </InputFieldStacked>
            <InputFieldStacked isGroupElement icon="arrow-up-and-right-big">
                <InputFieldTwo label="Forwards to" as={SelectTwo} unstyled className="rounded-none" placeholder="one">
                    <Option title="one" value="one" />
                    <Option title="two" value="two" />
                    <Option title="three" value="three" />
                </InputFieldTwo>
            </InputFieldStacked>
            <InputFieldStacked isGroupElement icon="note">
                <InputFieldTwo
                    label="Note"
                    as={TextAreaTwo}
                    autoGrow
                    unstyled
                    className="rounded-none p-0 resize-none"
                    placeholder="Textarea can autogrow."
                />
            </InputFieldStacked>
        </InputFieldStackedGroup>
    ),
};
