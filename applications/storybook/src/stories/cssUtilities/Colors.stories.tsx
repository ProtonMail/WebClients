import clsx from '@proton/utils/clsx';

import mdx from './Colors.mdx';

export default {
    title: 'CSS Utilities/Colors',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

type ColorItemProps = {
    className: string;
};

type ColorPaletteProps = {
    children: React.ReactNode;
};

const ColorItem = ({ className }: ColorItemProps) => (
    <div
        className={clsx(
            'w-custom text-sm flex items-center justify-center p-4 rounded shadow-norm border user-select',
            className
        )}
        style={{ 'aspect-ratio': '1', '--w-custom': '8em' }}
    >
        .{className}
    </div>
);

const TextItem = ({ className }: ColorItemProps) => (
    <div
        className={clsx(
            'flex items-center justify-center p-4 rounded shadow-norm border user-select',
            className,
            className === 'color-invert' ? 'bg-primary' : ''
        )}
    >
        .{className}
    </div>
);

const ColorPalette = ({ children }: ColorPaletteProps) => (
    <>
        <strong className="block mb-2">on UI Standard</strong>
        <div className={clsx('ui-standard border rounded-lg p-4 mb-8 flex flex-wrap gap-4')}>{children}</div>
        <strong className="block mb-2">on UI prominent</strong>
        <div className={clsx('ui-prominent border rounded-lg p-4 mb-8 flex flex-wrap gap-4')}>{children}</div>
    </>
);

export const BackgroundColors = () => (
    <>
        <ColorPalette>
            <ColorItem className="bg-norm" />
            <ColorItem className="bg-weak" />
            <ColorItem className="bg-strong" />
            <ColorItem className="bg-primary" />
            <ColorItem className="bg-danger" />
            <ColorItem className="bg-warning" />
            <ColorItem className="bg-success" />
            <ColorItem className="bg-info" />
        </ColorPalette>
    </>
);

export const TextColors = () => (
    <>
        <ColorPalette>
            <TextItem className="color-norm" />
            <TextItem className="color-weak" />
            <TextItem className="color-strong" />
            <TextItem className="color-primary" />
            <TextItem className="color-danger" />
            <TextItem className="color-warning" />
            <TextItem className="color-success" />
            <TextItem className="color-info" />
            <TextItem className="color-hint" />
            <TextItem className="color-disabled" />
            <TextItem className="color-invert" />
        </ColorPalette>
    </>
);
