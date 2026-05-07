import type { ReactNode } from 'react';

import { c } from 'ttag';

import { selectUser } from '@proton/account/user';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import AppLink from '@proton/components/components/link/AppLink';
import Logo from '@proton/components/components/logo/Logo';
import PublicTopBanners from '@proton/components/containers/topBanners/PublicTopBanners';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { type SafetyReviewBackLink, getBackCopy } from './getSafetyReviewBackLink';

import './SafetyReviewLayout.scss';

export const SafetyReviewLogo = ({ backLink }: { backLink: SafetyReviewBackLink }) => {
    return <Logo appName={backLink.appName} />;
};

export const SafetyReviewBackButton = ({ backLink }: { backLink: SafetyReviewBackLink }) => {
    return (
        <ButtonLike
            as={AppLink}
            toApp={backLink.context === 'settings' ? undefined : backLink.appName}
            to={backLink.to}
            target="_self"
            shape="ghost"
            className="inline-flex items-center color-primary ml-custom md:ml-0"
            style={{ '--ml-custom': 'calc(-1 * (var(--padding-inline) * 2))' }}
            title={getBackCopy(backLink)}
            icon
            pill
        >
            <IcChevronLeft className="shrink-0 rtl:mirror" size={6} />
        </ButtonLike>
    );
};

export const SafetyReviewHeader = ({ logo, backButton }: { logo: ReactNode; backButton: ReactNode }) => {
    const user = useSelector(selectUser)?.value;
    const nameToDisplay = user?.DisplayName || user?.Name || user?.Email || '';
    const initials = getInitials(nameToDisplay);
    const email = user?.Email ?? '';
    return (
        <header className="safety-review-header grid flex-nowrap justify-space-between items-center gap-2 md:gap-4 mb-2 md:mb-6 safety-review-entrance-animation">
            <div className="inline-flex flex-nowrap shrink-0 gap-4 items-center">
                {backButton}
                <div className="shrink-0 hidden md:flex items-center">{logo}</div>
            </div>

            <div
                className="w-full max-w-custom hidden md:flex gap-3 items-center rounded relative text-sm ml-auto"
                style={{ '--max-w-custom': '25rem' }}
            >
                <div className="flex-1 text-right">
                    <div className="text-ellipsis text-bold">{nameToDisplay}</div>
                    {email && (
                        <div className="color-weak text-ellipsis" title={email}>
                            {email}
                        </div>
                    )}
                </div>
                <div
                    className="min-w-custom min-h-custom flex rounded bg-strong"
                    style={{ '--min-w-custom': '1.75rem', '--min-h-custom': '1.75rem' }}
                >
                    <span className="m-auto text-semibold" aria-hidden="true">
                        {initials}
                    </span>
                </div>
            </div>
            <div className="md:mb-8 text-center safety-review-header-title">
                <h1 className="m-0 text-xl md:text-4xl text-semibold">
                    {c('safety_review').t`Your recovery checklist`}
                </h1>
            </div>
        </header>
    );
};

export const SafetyReviewLayout = ({ header, children }: { children: ReactNode; header: ReactNode }) => {
    return (
        <>
            <PublicTopBanners />
            <div
                className={clsx(
                    'safety-review-layout fade-in',
                    '*:min-size-auto',
                    'flex flex-nowrap flex-column',
                    'h-full overflow-auto relative',
                    'p-4 sm:p-5'
                )}
            >
                {header}
                <main>{children}</main>
            </div>
        </>
    );
};
