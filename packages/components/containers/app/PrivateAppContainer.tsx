import { ReactNode, Ref } from 'react';

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
            <div
                className="content-container flex flex-column flex-nowrap overflow-hidden flex-1 relative"
                ref={containerRef}
            >
                {top}
                <div className="content ui-prominent flex-auto flex flex-column flex-nowrap reset4print">
                    <div className="flex flex-1 flex-nowrap">
                        {sidebar}
                        <div className="flex flex-column flex-1 flex-nowrap reset4print">
                            <div className="flex flex-1 flex-nowrap">
                                <div className="main ui-standard flex flex-column flex-nowrap flex-1 reset4print">
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
