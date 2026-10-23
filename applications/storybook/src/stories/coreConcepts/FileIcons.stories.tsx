import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonGroup } from '@proton/components/components/button/ButtonGroup';
import type { MimeIconComponent } from '@proton/file-icons/component';
import type { IconSize } from '@proton/icons/types';

const meta: Meta = {
    title: 'Core Concepts/File icons',
    parameters: {
        docs: {
            description: {
                component:
                    'File type icons for Proton applications. Import the matching `Mime<Name>` component from `@proton/file-icons/icons/Mime<Name>`, or use `getFileIcon(mimeType)` from `@proton/file-icons/getFileIcon` to pick one from a MIME type. Each icon has a small, medium and large drawing: sizes below 5 use the small one, 5 to 9 the medium one, and 10 and up the large one.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

const iconsContext = require.context('../../../../../packages/file-icons/icons', false, /\.tsx$/);

const iconComponents: Record<string, MimeIconComponent> = Object.fromEntries(
    iconsContext.keys().map((key) => {
        const name = key.replace(/^\.\//, '').replace(/\.tsx$/, '');
        return [name, iconsContext(key)[name] as MimeIconComponent];
    })
);

const iconNames = Object.keys(iconComponents).sort();

const sizes: IconSize[] = [4, 5, 7, 10, 15];

const FileIconsGallery = () => {
    const [selectedSize, setSelectedSize] = useState<IconSize>(10);

    return (
        <>
            <ButtonGroup>
                {sizes.map((size) => (
                    <Button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        selected={size === selectedSize}
                        title={`Set icon size to ${size}`}
                    >
                        {size}
                    </Button>
                ))}
            </ButtonGroup>
            <div className="icon-grid mt-8">
                {iconNames.map((componentName) => {
                    const IconComponent = iconComponents[componentName];
                    return (
                        <div className="border rounded text-center p-4" key={componentName}>
                            <IconComponent size={selectedSize} />
                            <div className="mt-4 text-monospace lh120 user-select">{componentName}</div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export const Default: Story = {
    render: () => <FileIconsGallery />,
};
