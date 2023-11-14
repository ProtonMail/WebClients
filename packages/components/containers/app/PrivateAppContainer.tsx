import { ReactNode, Ref } from 'react';

import ElectronDraggeableHeaderWrapper from '@proton/components/components/electron/ElectronDraggeableHeaderWrapper';
import clsx from '@proton/utils/clsx';

interface Props {
    containerRef?: Ref<HTMLDivElement>;
    header?: ReactNode;
    sidebar: ReactNode;
    children: ReactNode;
    top?: ReactNode;
    bottom?: ReactNode;
    drawerSidebar?: ReactNode;
    drawerApp?: ReactNode;
}

const PrivateAppContainer = ({ header, sidebar, children, top, bottom, containerRef, drawerApp }: Props) => {
    return (
        <div className="flex flex-row flex-nowrap h-full">
            <ElectronDraggeableHeaderWrapper />
            <div
                className="content-container flex flex-column flex-nowrap no-scroll flex-item-fluid relative"
                ref={containerRef}
            >
                {top}
                <div className="content ui-prominent flex-item-fluid-auto flex flex-column flex-nowrap reset4print">
                    <div className="flex flex-item-fluid flex-nowrap">
                        {sidebar}
                        <div className="flex flex-column flex-item-fluid flex-nowrap reset4print">
                            <div className="flex flex-item-fluid flex-nowrap">
                                <div
                                    className={clsx(['main ui-standard flex flex-column flex-nowrap flex-item-fluid'])}
                                >
                                    {header}
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {bottom}
            </div>
            {drawerApp}
        </div>
    );
};

export default PrivateAppContainer;
