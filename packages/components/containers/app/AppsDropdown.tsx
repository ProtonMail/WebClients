import { ForwardedRef, Fragment, forwardRef } from 'react';

import { c } from 'ttag';

import ProtonBadge from '@proton/components/components/protonBadge/ProtonBadge';
import { FeatureCode } from '@proton/components/containers';
import { useConfig, useFeature, useUser } from '@proton/components/hooks';
import { getAppShortName } from '@proton/shared/lib/apps/helper';
import { APPS, APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { Icon, Logo, SimpleDropdown } from '../../components';
import ProductLink, { apps } from './ProductLink';

interface AppsDropdownProps {
    onDropdownClick?: () => void;
    app: APP_NAMES;
}

const AppsDropdown = ({ onDropdownClick, app, ...rest }: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const [user] = useUser();
    const { APP_NAME } = useConfig();
    const passSettingsFeature = useFeature<boolean>(FeatureCode.PassSettings);
    const isPassSettingsEnabled = passSettingsFeature.feature?.Value === true;

    return (
        <SimpleDropdown
            type="button"
            hasCaret={false}
            content={
                <Icon name="app-switch" size={24} className="apps-dropdown-button-icon flex-item-noshrink no-print" />
            }
            className="apps-dropdown-button flex-item-noshrink"
            dropdownClassName="apps-dropdown rounded-lg"
            originalPlacement="bottom-start"
            title={c('Apps dropdown').t`${BRAND_NAME} applications`}
            onClick={onDropdownClick}
            disableDefaultArrowNavigation
            contentProps={{
                className: 'rounded-lg',
            }}
            {...rest}
            ref={ref}
            as="button"
        >
            <ul className="unstyled my-0 p-4">
                {apps({ isPassSettingsEnabled }).map((appToLinkTo) => {
                    const appToLinkToName = getAppShortName(appToLinkTo);
                    const current = app && appToLinkTo === app;

                    return (
                        <Fragment key={appToLinkTo}>
                            <li className="dropdown-item apps-dropdown-item">
                                <ProductLink
                                    ownerApp={APP_NAME}
                                    app={app}
                                    appToLinkTo={appToLinkTo}
                                    user={user}
                                    className="text-center text-no-decoration outline-none--at-all apps-dropdown-link"
                                >
                                    <div
                                        className="apps-dropdown-logo-wrapper flex flex-align-items-center flex-justify-center rounded-lg border border-weak w-custom h-custom mx-auto"
                                        style={{ '--w-custom': '52px', '--h-custom': '52px' }}
                                    >
                                        <Logo
                                            appName={appToLinkTo}
                                            variant="glyph-only"
                                            className="flex-item-noshrink"
                                            size={36}
                                        />
                                    </div>
                                    <span
                                        className={clsx(
                                            'block text-center text-sm mt-1 apps-dropdown-app-name',
                                            current ? 'color-norm text-semibold' : 'color-weak'
                                        )}
                                        aria-hidden
                                    >
                                        {appToLinkToName}
                                    </span>
                                    {appToLinkTo === APPS.PROTONPASS && (
                                        <ProtonBadge text={c('Info').t`New`} tooltipText="" selected={false} />
                                    )}
                                </ProductLink>
                            </li>
                        </Fragment>
                    );
                })}
            </ul>
        </SimpleDropdown>
    );
};

export default forwardRef<HTMLButtonElement, AppsDropdownProps>(AppsDropdown);
