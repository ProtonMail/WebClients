import React from 'react';
import { c } from 'ttag';

import { classnames, ButtonLike, Href, Icon, MainLogo } from '@proton/components';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import './Layout.scss';

interface Props {
    reportAbuseButton?: React.ReactNode;
    small?: boolean;
    children: React.ReactNode;
}

export default function SharedPageLayout({ reportAbuseButton, small, children }: Props) {
    return (
        <div className="shared-page-layout-bg flex-no-min-children flex-nowrap flex-column h100 scroll-if-needed relative">
            <header className="shared-page-layout-logo">
                <Href className="flex-item-noshrink" href={getStaticURL('')}>
                    <MainLogo to="/" className="mb1" />
                </Href>
            </header>
            <div
                className={classnames([
                    'shared-page-layout-container flex flex-nowrap',
                    small && 'shared-page-layout-container-small',
                ])}
            >
                <div className="flex-item-fluid">{children}</div>
                {!small && <SharedPageGetDriveSidebar />}
            </div>
            <footer className="shared-page-layout-footer">
                {reportAbuseButton}
                <p>{c('Title').t`Based in Switzerland, available globally`}</p>
            </footer>
        </div>
    );
}

function SharedPageGetDriveSidebar() {
    return (
        <div className="flex flex-column flex-justify-center flex-nowrap w40 ml2">
            <h3>{c('Title').t`You've got files`}</h3>
            <p>{c('Info')
                .t`These files were shared using end-to-end encryption. To ensure their security — and the security of all your documents, photos, and files — store them in Proton Drive, the cloud storage service you can trust.`}</p>
            <p>
                <ButtonLike color="norm" shape="outline" as="a" href="/">{c('Action').t`Get Proton Drive`}</ButtonLike>
            </p>
            <div className="flex flex-justify-space-between">
                <span>
                    <Icon name="lock-check-filled" /> {c('Info').t`Encrypted`}
                </span>
                <span>
                    <Icon name="plus-circle-filled" color="red" /> {c('Info').t`Swiss privacy`}
                </span>
                <span>
                    <Icon name="shield-half-filled" /> {c('Info').t`Secure sharing`}
                </span>
            </div>
        </div>
    );
}
