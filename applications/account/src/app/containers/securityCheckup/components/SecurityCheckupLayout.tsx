import { type ReactNode, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { securityCheckupSlice } from '@proton/account';
import { ButtonLike } from '@proton/atoms/Button';
import { Icon, Logo, ProtonLogo, PublicTopBanners, useSecurityCheckup, useTheme, useUser } from '@proton/components';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import { isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { useAccountDispatch } from '../../../store/hooks';

export interface Props {
    children: ReactNode;
}

const SecurityCheckupLayout = ({ children }: Props) => {
    const { backLink } = useSecurityCheckup();
    const history = useHistory();
    const location = useLocation();

    const dispatch = useAccountDispatch();

    const theme = useTheme();

    const [user] = useUser();

    const nameToDisplay = user.DisplayName || user.Name || user.Email || '';
    const initials = getInitials(nameToDisplay);

    const getLogo = () => {
        if (!backLink?.app) {
            return <ProtonLogo variant="full" color={theme.information.dark ? 'invert' : undefined} />;
        }

        return <Logo appName={backLink.app} />;
    };

    const isRoot = location.pathname === SECURITY_CHECKUP_PATHS.ROOT;

    const BackButton = () => {
        if (!isRoot) {
            return (
                <ButtonLike
                    as={Link}
                    replace
                    to={SECURITY_CHECKUP_PATHS.ROOT}
                    shape="outline"
                    color="norm"
                    className="inline-flex items-center"
                >
                    <Icon name="arrow-left" className="shrink-0 mr-1 mb-0.5" />
                    {c('l10n_nightly: Security checkup').t`Account safety review`}
                </ButtonLike>
            );
        }

        if (!backLink || !backLink.app) {
            return (
                <ButtonLike
                    as={Link}
                    to={backLink?.to || '/'}
                    shape="outline"
                    color="norm"
                    className="inline-flex items-center"
                >
                    <Icon name="arrow-left" className="shrink-0 mr-1 mb-0.5" />
                    {c('Action').t`Settings`}
                </ButtonLike>
            );
        }

        const { link, label }: { link: string; label: string } = (() => {
            const link = stripLocalBasenameFromPathname(backLink.href);

            if (backLink.app === APPS.PROTONMAIL) {
                return { label: c('Navigation').t`Inbox`, link };
            }
            if (backLink.app === APPS.PROTONCALENDAR) {
                return { label: c('Navigation').t`Calendar`, link };
            }
            if (backLink.app === APPS.PROTONDRIVE) {
                return { label: c('Navigation').t`Drive`, link };
            }
            if (backLink.app === APPS.PROTONPASS) {
                return { label: c('Navigation').t`Pass vaults`, link };
            }
            if (backLink.app === APPS.PROTONDOCS) {
                return { label: c('Navigation').t`Documents`, link };
            }
            if (backLink.app === APPS.PROTONWALLET) {
                return { label: c('wallet_signup_2024:Navigation').t`Wallet`, link };
            }

            return { label: c('Action').t`Back`, link };
        })();

        return (
            <ButtonLike as="a" href={link} shape="outline" color="norm" className="inline-flex items-center">
                <Icon name="arrow-left" className="shrink-0 mr-1 mb-0.5" />
                {label}
            </ButtonLike>
        );
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const continueParam = params.get('continue');

        if (!continueParam) {
            if (backLink) {
                params.append('continue', backLink.href);
                history.replace({ ...location, search: params.toString() });
            }
            return;
        }

        try {
            dispatch(
                securityCheckupSlice.actions.setBackLink({
                    backHref: decodeURIComponent(continueParam),
                    hostname: window.location.hostname,
                })
            );
        } catch (error) {
            params.delete('continue');
            history.replace({ ...location, search: params.toString() });
            return;
        }
    }, [location.search]);

    return (
        <>
            <PublicTopBanners />
            <div
                className={clsx(
                    '*:min-size-auto',
                    'flex flex-nowrap flex-column',
                    'h-full overflow-auto relative',
                    'p-4 sm:p-5'
                )}
            >
                <header className="flex flex-nowrap justify-space-between items-center gap-4 mb-6">
                    <div className="inline-flex flex-nowrap shrink-0 gap-4 items-center">
                        <div className={clsx('shrink-0', isElectronOnMac && 'md:pl-14 lg:pl-8')}>{getLogo()}</div>

                        <BackButton />
                    </div>

                    <div
                        className="w-full max-w-custom flex gap-3 items-center rounded relative text-sm"
                        style={{ '--max-w-custom': '25em' }}
                    >
                        <div className="flex-1 text-right">
                            <div className="text-ellipsis text-bold">{nameToDisplay}</div>
                            {user.Email && (
                                <div className="color-weak text-ellipsis" title={user.Email}>
                                    {user.Email}
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
                </header>
                <main>{children}</main>
            </div>
        </>
    );
};

export default SecurityCheckupLayout;
