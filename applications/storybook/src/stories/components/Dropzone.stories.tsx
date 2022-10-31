import { useState } from 'react';

import { Button } from '@proton/atoms';
import { Dropzone } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Dropzone.mdx';

export default {
    component: Dropzone,
    title: getTitle(__filename, false),
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
