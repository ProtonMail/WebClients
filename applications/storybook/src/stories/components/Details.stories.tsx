import { Details, Summary } from '@proton/components';

import mdx from './Details.mdx';

export default {
    component: Details,
    title: 'Components/Details',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    return (
        <>
            <Details>
                <Summary>Here a summary</Summary>
                Lorem Ipsum dolor si amet.
            </Details>
        </>
    );
};

export const Opened = () => {
    return (
        <>
            <Details open>
                <Summary>Here a summary opened</Summary>
                Lorem Ipsum dolor si amet.
            </Details>
        </>
    );
};

export const Triangle = () => {
    return (
        <>
            <Details>
                <Summary useTriangle>Here a summary with triangle icon</Summary>
                Lorem Ipsum dolor si amet.
            </Details>
        </>
    );
};
