import { ReactNode } from 'react';

import './ToolbarRow.scss';

interface Props {
    titleArea: ReactNode;
    toolbar: ReactNode;
}

const ToolbarRow = ({ titleArea, toolbar }: Props) => {
    return (
        <div className="toolbar-row flex flex-nowrap w-full border-bottom border-weak flex-item-noshrink">
            <div className="toolbar-row-toolbar flex-item-noshrink">{toolbar}</div>
            <div className="toolbar-row-titleArea flex items-center pl-3 pr-1">{titleArea}</div>
        </div>
    );
};

export default ToolbarRow;
