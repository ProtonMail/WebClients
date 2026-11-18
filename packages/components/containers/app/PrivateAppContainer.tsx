import type { MouseEvent, ReactNode, Ref } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { MAIN_CONTENT_ID } from '../layout/constants';

interface Props {
    containerRef?: Ref<HTMLDivElement>;
    header?: ReactNode;
    sidebar: ReactNode;
    children: ReactNode;
    top?: ReactNode;
    bottom?: ReactNode;
    drawerApp?: ReactNode;
}

const PrivateAppContainer = ({ header, sidebar, children, top, bottom, containerRef, drawerApp }: Props) => {
    const mainColumnRef = useRef<HTMLDivElement>(null);

    // Focus instead of following the link, so the URL hash and the router are left alone
    const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        // Views without a PrivateMainArea (e.g. while loading) fall back to the column around the page content
        const target = document.getElementById(MAIN_CONTENT_ID) ?? mainColumnRef.current;
        if (!target) {
            return;
        }
        if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
        }
        target.focus();
    };

    return (
        <>
            <div className="flex flex-row flex-nowrap h-full">
                <div
                    className="content-container flex flex-column flex-nowrap overflow-hidden flex-1 relative"
                    ref={containerRef}
                >
                    {/* First in the page, before the top banners, which can hold links and buttons */}
                    <a href={`#${MAIN_CONTENT_ID}`} className="sr-only sr-only-focusable" onClick={focusMainContent}>
                        {c('Action').t`Skip to main content`}
                    </a>
                    {top}
                    <div className="content ui-prominent flex-auto flex flex-column flex-nowrap reset4print">
                        <div className="flex flex-1 flex-nowrap">
                            {sidebar}
                            <div className="flex flex-column flex-1 flex-nowrap reset4print">
                                <div className="flex flex-1 flex-nowrap">
                                    <div
                                        ref={mainColumnRef}
                                        className="main ui-standard flex flex-column flex-nowrap flex-1 reset4print outline-none--at-all"
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
        </>
    );
};

export default PrivateAppContainer;
