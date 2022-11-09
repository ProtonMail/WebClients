import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon, Logo, Unauthenticated, classnames, useConfig } from '@proton/components';
import { BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import './Layout.scss';

const DRIVE_LANGIND_PAGE = '/drive';
const DRIVE_PRICING_PAGE = '/drive/pricing?product=drive';

interface Props {
    reportAbuseButton?: React.ReactNode;
    withSidebar?: boolean;
    expand?: boolean;
    children: React.ReactNode;
}

export default function SharedPageLayout({ reportAbuseButton, withSidebar, expand, children }: Props) {
    const { APP_NAME } = useConfig();

    return (
        <Unauthenticated>
            <div className="shared-page-layout-bg flex-no-min-children flex-nowrap flex-column h100 scroll-if-needed relative">
                <header className="shared-page-layout-logo flex flex-align-items-center flex-justify-space-between">
                    <a href={getStaticURL(DRIVE_LANGIND_PAGE)} className="mt0-1">
                        <Logo appName={APP_NAME} />
                    </a>
                    <ButtonLike
                        className="no-tablet no-desktop"
                        color="norm"
                        shape="outline"
                        as="a"
                        href={getStaticURL(DRIVE_PRICING_PAGE)}
                        target="_blank"
                    >
                        {c('Action').t`Get ${DRIVE_APP_NAME}`}
                    </ButtonLike>
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
                    <p>
                        {
                            // translator: full sentence 'Proton. Privacy by default.'
                            c('Footer').t`${BRAND_NAME}. Privacy by default.`
                        }
                    </p>
                </footer>
            </div>
        </Unauthenticated>
    );
}

function SharedPageGetDriveSidebar() {
    return (
        <div className="flex flex-column flex-nowrap w45 no-mobile">
            <div>
                <h3 className="text-bold">{c('Title').t`You've got files`}</h3>
                <p>{c('Info')
                    .t`These files were shared using end-to-end encryption. To keep them secure — and all your documents, photos, and files private — store them in your own Proton Drive. It's easy-to-use and free.`}</p>
                <p>
                    <ButtonLike
                        color="norm"
                        shape="outline"
                        as="a"
                        href={getStaticURL(DRIVE_PRICING_PAGE)}
                        target="_blank"
                    >
                        {c('Action').t`Get ${DRIVE_APP_NAME}`}
                    </ButtonLike>
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
