import { ForwardedRef, forwardRef, Fragment } from 'react';
import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';

import { useApps } from '../../hooks';
import { AppLink, Logo, Icon, SimpleDropdown, SettingsLink, VpnLogo } from '../../components';

interface AppsDropdownProps {
    onDropdownClick?: () => void;
}

const AppsDropdown = ({ onDropdownClick, ...rest }: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const applications = useApps();

    const apps = applications.map((app) => ({
        app: app,
        name: getAppName(app),
    }));

    const vpnName = getAppName(APPS.PROTONVPN_SETTINGS);

    const itemClassName =
        'dropdown-item-link w100 flex flex-nowrap flex-align-items-center py0-25 pl1 pr1-5 color-norm text-no-decoration';

    return (
        <SimpleDropdown
            as="button"
            type="button"
            hasCaret={false}
            content={<Icon name="grid-3" className="apps-dropdown-button-icon flex-item-noshrink no-print" />}
            className="apps-dropdown-button flex-item-noshrink"
            dropdownClassName="apps-dropdown"
            originalPlacement="bottom-left"
            title={c('Apps dropdown').t`Proton applications`}
            onClick={onDropdownClick}
            disableDefaultArrowNavigation
            ref={ref}
            {...rest}
        >
            <ul className="unstyled mt0 mb0">
                {apps.map(({ app, name }, index) => {
                    return (
                        <Fragment key={app}>
                            <li className="dropdown-item">
                                <AppLink key={index} to="/" toApp={app} className={itemClassName} title={name}>
                                    <Logo appName={app} variant="glyph-only" className="flex-item-noshrink mr0-5" />
                                    {name}
                                    {app === APPS.PROTONDRIVE && (
                                        <span className="inline-block flex-item-noshrink bg-primary rounded-full text-sm px0-75 ml1">
                                            Beta
                                        </span>
                                    )}
                                </AppLink>
                            </li>
                            <li className="dropdown-item-hr my0-25" aria-hidden="true" />
                        </Fragment>
                    );
                })}

                <li className="dropdown-item">
                    <SettingsLink path="/" app={APPS.PROTONVPN_SETTINGS} title={vpnName} className={itemClassName}>
                        <VpnLogo variant="glyph-only" className="mr0-5" />
                        {vpnName}
                    </SettingsLink>
                </li>
            </ul>
        </SimpleDropdown>
    );
};

export default forwardRef<HTMLButtonElement, AppsDropdownProps>(AppsDropdown);
