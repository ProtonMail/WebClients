import React from 'react';

import { UnAuthenticated, useActiveBreakpoint } from '@proton/components';
import Footer from '@proton/components/components/footer/Footer';

import { ClosePartialPublicViewButton } from './ClosePartialPublicViewButton';
import { SharedPageHeader } from './SharedPageHeader';

import './Layout.scss';

interface Props {
    FooterComponent?: React.ReactNode;
    children: React.ReactNode;
    isPartialView?: boolean;
}

export default function SharedPageLayout({ FooterComponent, children, isPartialView }: Props) {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <UnAuthenticated>
            <div
                className={'shared-page-layout-bg md:px-10 flex flex-nowrap flex-column h-full overflow-auto relative'}
            >
                {isPartialView ? (
                    <ClosePartialPublicViewButton className="self-start flex items-center" />
                ) : (
                    <SharedPageHeader />
                )}
                <main className="shared-page-layout-container bg-norm w-full flex flex-nowrap flex-column md:flex-row flex-1 h-auto px-5">
                    <div className="flex-1 flex flex-column flex-nowrap">{children}</div>
                </main>
                {viewportWidth['<=small'] && typeof FooterComponent !== 'undefined' && (
                    <Footer className="justify-space-between items-center p-0">{FooterComponent}</Footer>
                )}
            </div>
        </UnAuthenticated>
    );
}
