import { ForwardedRef, Fragment, forwardRef } from 'react';

import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers';
import { useConfig, useFeature, useUser } from '@proton/components/hooks';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

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
            dropdownClassName="apps-dropdown"
            originalPlacement="bottom-start"
            title={c('Apps dropdown').t`${BRAND_NAME} applications`}
            onClick={onDropdownClick}
            disableDefaultArrowNavigation
            {...rest}
            ref={ref}
            as="button"
        >
            <ul className="unstyled my-0">
                {apps({ isPassSettingsEnabled }).map((appToLinkTo, i, array) => {
                    const appToLinkToName = getAppName(appToLinkTo);

                    return (
                        <Fragment key={appToLinkTo}>
                            <li className="dropdown-item">
                                <ProductLink
                                    ownerApp={APP_NAME}
                                    app={app}
                                    appToLinkTo={appToLinkTo}
                                    user={user}
                                    className="dropdown-item-link w100 flex flex-nowrap flex-align-items-center py0-5 pl1 pr1-5 color-norm text-no-decoration"
                                >
                                    <Logo
                                        appName={appToLinkTo}
                                        variant="glyph-only"
                                        className="flex-item-noshrink mr-2"
                                    />
                                    {appToLinkToName}
                                </ProductLink>
                            </li>
                            {i !== array.length - 1 && <li className="dropdown-item-hr" aria-hidden="true" />}
                        </Fragment>
                    );
                })}
            </ul>
        </SimpleDropdown>
    );
};

export default forwardRef<HTMLButtonElement, AppsDropdownProps>(AppsDropdown);
