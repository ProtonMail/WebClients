import React, { useState } from 'react';
import { Dropzone, Button } from 'react-components';

import mdx from './Dropzone.mdx';

export default {
    component: Dropzone,
    title: 'Components / Dropzone',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = ({ ...args }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Dropzone
            isHovered={isHovered}
            onDrop={() => {}}
            onDragEnter={() => setIsHovered(true)}
            onDragLeave={() => setIsHovered(false)}
            {...args}
        >
            <Button>Drop or tap to upload (not really)</Button>
        </Dropzone>
    );
};

Basic.args = {};

const dragEventArg = {
    type: { required: true },
    table: {
        type: {
            summary: '(event: DragEvent<Element>) => void',
        },
    },
    control: {
        type: null,
    },
};

Basic.argTypes = {
    onDragEnter: dragEventArg,
    onDragLeave: dragEventArg,
    onDrop: dragEventArg,
};
