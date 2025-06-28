import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './ToolbarRow.scss';

interface Props {
    titleArea: ReactNode;
    toolbar: ReactNode;
    className?: string;
    withBorder?: boolean;
    withPadding?: boolean;
}

const ToolbarRow = ({ titleArea, toolbar, className, withBorder = true, withPadding = true }: Props) => {
    return (
        <div
            className={clsx(
                'toolbar-row flex flex-nowrap shrink-0',
                withBorder && 'border-bottom border-weak',
                className
            )}
        >
            <div className="toolbar-row-toolbar shrink-0">{toolbar}</div>
            <div className={clsx('toolbar-row-titleArea flex items-center', withPadding && 'pl-3 pr-1')}>
                {titleArea}
            </div>
        </div>
    );
};

export default ToolbarRow;
