import React from 'react';
import { c } from 'ttag';

import { classnames, ButtonLike, Icon, MainLogo, Unauthenticated } from '@proton/components';

import './Layout.scss';

interface Props {
    reportAbuseButton?: React.ReactNode;
    withSidebar?: boolean;
    expand?: boolean;
    children: React.ReactNode;
}

export default function SharedPageLayout({ reportAbuseButton, withSidebar, expand, children }: Props) {
    return (
        <Unauthenticated>
            <div className="shared-page-layout-bg flex-no-min-children flex-nowrap flex-column h100 scroll-if-needed relative">
                <header className="shared-page-layout-logo">
                    <MainLogo to="/" className="mb1" />
                </header>
                <div
                    className={classnames([
                        'shared-page-layout-container flex flex-no-min-children flex-nowrap on-mobile-flex-column',
                        !withSidebar && 'shared-page-layout-container-without-sidebar',
                        expand && 'flex-item-fluid',
                    ])}
                >
                    <div className="flex-item-fluid on-mobile-mb1 flex flex-column flex-nowrap">{children}</div>
                    {withSidebar && <SharedPageGetDriveSidebar />}
                </div>
                <footer className="shared-page-layout-footer text-center">
                    {reportAbuseButton}
                    <p>{c('Title').t`Based in Switzerland, available globally`}</p>
                </footer>
            </div>
        </Unauthenticated>
    );
}

function SharedPageGetDriveSidebar() {
    return (
        <div className="flex flex-column flex-nowrap w45 on-mobile-ml0">
            <div>
                <h3 className="text-bold">{c('Title').t`You've got files`}</h3>
                <p>{c('Info')
                    .t`These files were shared using end-to-end encryption. To ensure their security — and the security of all your documents, photos, and files — store them in Proton Drive, the cloud storage service you can trust.`}</p>
                <p>
                    <ButtonLike color="norm" shape="outline" as="a" href="/">{c('Action')
                        .t`Get Proton Drive`}</ButtonLike>
                </p>
            </div>
            <div className="flex flex-justify-space-between on-mobile-flex-column">
                <span className="inline-flex flex-align-items-center flex-nowrap mr1">
                    <Icon name="lock-check-filled" className="mr0-25" />
                    {c('Info').t`Encrypted`}
                </span>
                <span className="inline-flex flex-align-items-center flex-nowrap mr1">
                    <svg
                        className="mr0-25"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8Z"
                            fill="white"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM6.56 6.56V4.48H9.44V6.56H11.52V9.44H9.44V11.52H6.56V9.44H4.48V6.56H6.56Z"
                            fill="#ED1C24"
                        />
                    </svg>
                    {c('Info').t`Swiss privacy`}
                </span>
                <span className="inline-flex flex-align-items-center flex-nowrap mr1">
                    <Icon name="shield-half-filled" className="mr0-25" />
                    {c('Info').t`Secure sharing`}
                </span>
            </div>
        </div>
    );
}
