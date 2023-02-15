import { SetStateAction, useState } from 'react';

import { Checkbox, Dropzone, InputFieldTwo, RadioGroup } from '@proton/components';
import { DropzoneShape, DropzoneSize } from '@proton/components/components/dropzone/Dropzone';

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

const sizes: DropzoneSize[] = ['small', 'medium', 'large'];
const shapes: DropzoneShape[] = ['norm', 'transparent', 'flashy', 'invisible'];
const toggles = ['showDragOverState', 'border', 'rounded', 'disabled'] as const;

// Hook only used in the demo
const useAddFiles = () => {
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    const handleAddFile = (files: File[]) => {
        const filenames = files.map((file) => file.name);
        setUploadedFiles([...uploadedFiles, ...filenames]);
    };

    return { uploadedFiles, setUploadedFiles, handleAddFile };
};

export const Custom = () => {
    const [content, setContent] = useState('');

    const [selectedSize, setSelectedSize] = useState<DropzoneSize>('medium');
    const [selectedShape, setSelectedShape] = useState<DropzoneShape>('norm');
    const [selectedToggles, setSelectedToggles] = useState([false, true, true, false]);
    const { uploadedFiles, handleAddFile } = useAddFiles();

    return (
        <div className="p2">
            <div className="flex flex-align-items-stretch">
                <div className="mr2">
                    <strong className="block mb1">Size</strong>
                    <RadioGroup
                        name="selected-size"
                        onChange={(v) => setSelectedSize(v)}
                        value={selectedSize}
                        options={sizes.map((size) => ({ value: size, label: size }))}
                    />
                </div>
                <div className="mr2">
                    <strong className="block mb1">Shape</strong>
                    <RadioGroup
                        name="selected-shape"
                        onChange={(v) => setSelectedShape(v)}
                        value={selectedShape}
                        options={shapes.map((shape) => ({ value: shape, label: shape }))}
                    />
                </div>
                <div className="mr2">
                    <strong className="block mb1">Toggles</strong>
                    {toggles.map((prop, i) => {
                        return (
                            <div className="mb0-5">
                                <Checkbox
                                    checked={selectedToggles[i]}
                                    onChange={({ target: { checked } }) => {
                                        setSelectedToggles(
                                            selectedToggles.map((oldValue, otherIndex) =>
                                                otherIndex === i ? checked : oldValue
                                            )
                                        );
                                    }}
                                >
                                    {prop}
                                </Checkbox>
                            </div>
                        );
                    })}
                </div>
                <div className="mr2">
                    <strong className="block mb1">Custom content</strong>
                    <InputFieldTwo
                        name="content"
                        id="content"
                        label="Content"
                        value={content}
                        onChange={(e: { target: { value: SetStateAction<string> } }) => setContent(e.target.value)}
                        placeholder="Set a custom content"
                    />
                </div>
            </div>
            <div className="mt1 flex flex-align-items-center  ">
                <Dropzone
                    onDrop={handleAddFile}
                    size={selectedSize}
                    shape={selectedShape}
                    customContent={content}
                    {...selectedToggles.reduce<{ [key: string]: boolean }>((acc, value, i) => {
                        acc[toggles[i]] = value;
                        return acc;
                    }, {})}
                >
                    <div
                        className="flex flex-align-items-center relative w100 border p1"
                        style={{ minHeight: '300px' }}
                    >
                        <div className="flex flex-column text-center h100 w100">
                            <span>Hover with a file to see the dropzone (or select showDragOverState toggle)</span>
                            <br />
                            <span>This is the children content</span>
                            <span>You uploaded these files [{uploadedFiles.join(',')}]</span>
                        </div>
                    </div>
                </Dropzone>
            </div>
        </div>
    );
};
export const Invisible = () => {
    const { uploadedFiles, handleAddFile } = useAddFiles();

    return (
        <div className="p2">
            <div className="mt1 flex flex-align-items-center  ">
                <Dropzone onDrop={handleAddFile} shape="invisible">
                    <div
                        className="flex flex-align-items-center relative w100 border p1"
                        style={{ minHeight: '300px' }}
                    >
                        <div className="flex flex-column text-center h100 w100">
                            <span>Hover with a file to see the dropzone (or select showDragOverState toggle)</span>
                            <br />
                            <span>This is the children content</span>
                            <span>You uploaded these files [{uploadedFiles.join(',')}]</span>
                        </div>
                    </div>
                </Dropzone>
            </div>
        </div>
    );
};
