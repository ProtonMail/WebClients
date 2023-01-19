import { Children, ForwardedRef, Fragment, forwardRef, isValidElement } from 'react';

import { c } from 'ttag';

import { APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

import { Icon, SimpleDropdown } from '../../components';
import AppsLinks from './AppsLinks';

interface AppsDropdownProps {
    onDropdownClick?: () => void;
    app: APP_NAMES;
}

const AppsDropdown = ({ onDropdownClick, app, ...rest }: AppsDropdownProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const itemClassName =
        'dropdown-item-link w100 flex flex-nowrap flex-align-items-center py0-5 pl1 pr1-5 color-norm text-no-decoration';

    return (
        <SimpleDropdown
            as="button"
            type="button"
            hasCaret={false}
            content={<Icon name="grid-3" className="apps-dropdown-button-icon flex-item-noshrink no-print" />}
            className="apps-dropdown-button flex-item-noshrink"
            dropdownClassName="apps-dropdown"
            originalPlacement="bottom-start"
            title={c('Apps dropdown').t`${BRAND_NAME} applications`}
            onClick={onDropdownClick}
            disableDefaultArrowNavigation
            ref={ref}
            {...rest}
        >
            <ul className="unstyled mt0 mb0">
                {Children.toArray(<AppsLinks app={app} itemClassName={itemClassName} name />)
                    .filter(isValidElement)
                    .map((child, i, array) => {
                        return (
                            <Fragment key={child.key}>
                                <li className="dropdown-item">{child}</li>
                                {i !== array.length - 1 && <li className="dropdown-item-hr" aria-hidden="true" />}
                            </Fragment>
                        );
                    })}
            </ul>
        </SimpleDropdown>
    );
};

export default forwardRef<HTMLButtonElement, AppsDropdownProps>(AppsDropdown);
