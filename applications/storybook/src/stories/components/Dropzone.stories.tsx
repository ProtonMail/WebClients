import type { SetStateAction } from 'react';
import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Dropzone from '@proton/components/components/dropzone/Dropzone';
import type { DropzoneShape, DropzoneSize } from '@proton/components/components/dropzone/Dropzone';
import Checkbox from '@proton/components/components/input/Checkbox';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

const sizes: DropzoneSize[] = ['small', 'medium', 'large'];
const shapes: DropzoneShape[] = ['norm', 'transparent', 'flashy', 'invisible'];
const toggles = ['showDragOverState', 'border', 'rounded', 'disabled'] as const;

const useAddFiles = () => {
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

    const handleAddFile = (files: File[]) => {
        const filenames = files.map((file) => file.name);
        setUploadedFiles([...uploadedFiles, ...filenames]);
    };

    return { uploadedFiles, handleAddFile };
};

const DropzoneChildren = ({ uploadedFiles }: { uploadedFiles: string[] }) => (
    <div className="flex items-center w-full border p-4" style={{ minHeight: '300px' }}>
        <div className="flex flex-column text-center h-full w-full">
            <span>Hover with a file to see the dropzone (or select showDragOverState toggle)</span>
            <br />
            <span>This is the children content</span>
            <span>You uploaded these files [{uploadedFiles.join(',')}]</span>
        </div>
    </div>
);

const meta: Meta<typeof Dropzone> = {
    title: 'Components/Dropzone',
    component: Dropzone,
    parameters: {
        docs: {
            description: {
                component:
                    'Provides an area to drag and drop files onto, most likely for uploading. Supports different sizes, shapes, and customizable overlay content.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Dropzone>;

export const Default: Story = {
    render: () => {
        const { uploadedFiles, handleAddFile } = useAddFiles();

        return (
            <Dropzone onDrop={handleAddFile} size="medium" shape="norm" border rounded>
                <DropzoneChildren uploadedFiles={uploadedFiles} />
            </Dropzone>
        );
    },
};

export const SmallSize: Story = {
    render: () => {
        const { uploadedFiles, handleAddFile } = useAddFiles();

        return (
            <Dropzone onDrop={handleAddFile} size="small" shape="norm" border rounded>
                <DropzoneChildren uploadedFiles={uploadedFiles} />
            </Dropzone>
        );
    },
};

export const MediumSize: Story = {
    render: () => {
        const { uploadedFiles, handleAddFile } = useAddFiles();

        return (
            <Dropzone onDrop={handleAddFile} size="medium" shape="norm" border rounded>
                <DropzoneChildren uploadedFiles={uploadedFiles} />
            </Dropzone>
        );
    },
};

export const LargeSize: Story = {
    render: () => {
        const { uploadedFiles, handleAddFile } = useAddFiles();

        return (
            <Dropzone onDrop={handleAddFile} size="large" shape="norm" border rounded>
                <DropzoneChildren uploadedFiles={uploadedFiles} />
            </Dropzone>
        );
    },
};

export const InvisibleShape: Story = {
    render: () => {
        const { uploadedFiles, handleAddFile } = useAddFiles();

        return (
            <Dropzone onDrop={handleAddFile} shape="invisible">
                <DropzoneChildren uploadedFiles={uploadedFiles} />
            </Dropzone>
        );
    },
};

export const Playground: Story = {
    render: () => {
        const [content, setContent] = useState('');
        const [contentTitle, setContentTitle] = useState('');
        const [contentSubtext, setContentSubtext] = useState('');
        const [isCustomContent, setIsCustomContent] = useState(false);
        const [selectedSize, setSelectedSize] = useState<DropzoneSize>('medium');
        const [selectedShape, setSelectedShape] = useState<DropzoneShape>('norm');
        const [selectedToggles, setSelectedToggles] = useState([false, true, true, false]);
        const { uploadedFiles, handleAddFile } = useAddFiles();

        return (
            <div className="p-7">
                <div className="flex items-stretch">
                    <div className="mr-7">
                        <strong className="block mb-4">Size</strong>
                        <RadioGroup
                            name="selected-size"
                            onChange={(v) => setSelectedSize(v)}
                            value={selectedSize}
                            options={sizes.map((size) => ({ value: size, label: size }))}
                        />
                    </div>
                    <div className="mr-7">
                        <strong className="block mb-4">Shape</strong>
                        <RadioGroup
                            name="selected-shape"
                            onChange={(v) => setSelectedShape(v)}
                            value={selectedShape}
                            options={shapes.map((shape) => ({ value: shape, label: shape }))}
                        />
                    </div>
                    <div className="mr-7">
                        <strong className="block mb-4">Toggles</strong>
                        {toggles.map((prop, i) => (
                            <div className="mb-2" key={prop}>
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
                        ))}
                    </div>
                    <div className="mr-7">
                        <strong className="block mb-4">Content</strong>
                        <Checkbox
                            checked={isCustomContent}
                            onChange={({ target: { checked } }) => {
                                setIsCustomContent(checked);
                                if (!checked) {
                                    setContent('');
                                }
                            }}
                            className="mb-2"
                        >
                            Custom content
                        </Checkbox>
                        {isCustomContent ? (
                            <InputFieldTwo
                                name="content"
                                id="content"
                                label="Content"
                                value={content}
                                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                                    setContent(e.target.value)
                                }
                                placeholder="Set a custom content"
                            />
                        ) : (
                            <>
                                {selectedSize === 'large' && (
                                    <InputFieldTwo
                                        name="content-title"
                                        id="content-title"
                                        label="Content title"
                                        value={contentTitle}
                                        onChange={(e: { target: { value: SetStateAction<string> } }) =>
                                            setContentTitle(e.target.value)
                                        }
                                        placeholder="Set a custom content title"
                                    />
                                )}
                                <InputFieldTwo
                                    name="content-subtext"
                                    id="content-subtext"
                                    label="Content subtext"
                                    value={contentSubtext}
                                    onChange={(e: { target: { value: SetStateAction<string> } }) =>
                                        setContentSubtext(e.target.value)
                                    }
                                    placeholder="Set a custom content"
                                />
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex items-center">
                    <Dropzone
                        onDrop={handleAddFile}
                        size={selectedSize}
                        shape={selectedShape}
                        customContent={content}
                        contentTitle={contentTitle}
                        contentSubText={contentSubtext}
                        {...selectedToggles.reduce<{ [key: string]: boolean }>((acc, value, i) => {
                            acc[toggles[i]] = value;
                            return acc;
                        }, {})}
                    >
                        <DropzoneChildren uploadedFiles={uploadedFiles} />
                    </Dropzone>
                </div>
            </div>
        );
    },
};
