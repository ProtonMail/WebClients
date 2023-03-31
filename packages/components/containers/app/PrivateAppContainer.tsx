import { ReactNode, Ref } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    containerRef?: Ref<HTMLDivElement>;
    header: ReactNode;
    sidebar: ReactNode;
    children: ReactNode;
    top?: ReactNode;
    bottom?: ReactNode;
    drawerSidebar?: ReactNode;
    drawerVisibilityButton?: ReactNode;
    drawerApp?: ReactNode;
    mainBordered?: boolean;
    mainNoBorder?: boolean;
}

const PrivateAppContainer = ({
    header,
    sidebar,
    children,
    top,
    bottom,
    containerRef,
    drawerSidebar,
    drawerVisibilityButton,
    drawerApp,
    mainBordered,
    mainNoBorder,
}: Props) => {
    return (
        <div className="flex flex-row flex-nowrap h100">
            <div
                className="content-container flex flex-column flex-nowrap no-scroll flex-item-fluid relative"
                ref={containerRef}
            >
                {top}
                <div className="content ui-prominent flex-item-fluid-auto flex flex-column flex-nowrap reset4print">
                    <div className="flex flex-item-fluid flex-nowrap">
                        {sidebar}
                        <div className="flex flex-column flex-item-fluid flex-nowrap reset4print">
                            {header}
                            <div className="flex flex-item-fluid flex-nowrap">
                                <div
                                    className={clsx([
                                        'main ui-standard flex flex-column flex-nowrap flex-item-fluid',
                                        mainBordered && 'main--bordered',
                                        mainNoBorder && 'border-none',
                                    ])}
                                >
                                    {children}
                                </div>
                                {drawerVisibilityButton}
                                {drawerSidebar}
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
