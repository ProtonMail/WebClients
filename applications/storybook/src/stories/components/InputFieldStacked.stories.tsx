import {
    InputFieldStacked,
    InputFieldStackedGroup,
    InputFieldTwo,
    Option,
    SelectTwo,
    TextAreaTwo,
} from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './InputFieldStacked.mdx';

export default {
    component: InputFieldTwo,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    return (
        <InputFieldStacked icon="alias" classname="mb-2">
            <InputFieldTwo
                type="text"
                label="Title"
                className="rounded-none"
                placeholder="e.g., Amazon, eBay, Etsy"
                autoFocus
                unstyled
            />
        </InputFieldStacked>
    );
};

export const BoldExample = () => {
    return (
        <InputFieldStacked isBigger classname="mb-2">
            <InputFieldTwo
                type="text"
                label="Title"
                className="text-bold rounded-none"
                placeholder="e.g., Amazon, eBay, Etsy"
                autoFocus
                unstyled
            />
        </InputFieldStacked>
    );
};

export const Group = () => (
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
);
