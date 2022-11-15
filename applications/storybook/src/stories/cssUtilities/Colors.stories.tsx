import { classnames } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Colors.mdx';

export default {
    title: getTitle(__filename, false),
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
        className={classnames([
            'w8e text-sm flex flex-align-items-center flex-justify-center p1 rounded shadow-norm border user-select',
            className,
        ])}
        style={{ 'aspect-ratio': '1' }}
    >
        .{className}
    </div>
);

const TextItem = ({ className }: ColorItemProps) => (
    <div
        className={classnames([
            'flex flex-align-items-center flex-justify-center p1 rounded shadow-norm border user-select',
            className,
            className === 'color-invert' ? 'bg-primary' : '',
        ])}
    >
        .{className}
    </div>
);

const ColorPalette = ({ children }: ColorPaletteProps) => (
    <>
        <strong className="block mb0-5">on UI Standard</strong>
        <div className={classnames(['ui-standard border rounded-lg p1 mb2 flex flex-wrap flex-gap-1'])}>{children}</div>
        <strong className="block mb0-5">on UI prominent</strong>
        <div className={classnames(['ui-prominent border rounded-lg p1 mb2 flex flex-wrap flex-gap-1'])}>
            {children}
        </div>
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
