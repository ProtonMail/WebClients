import React, { ReactNode } from 'react';
import { classnames } from 'react-components';

interface Props {
    button?: ReactNode;
    label?: ReactNode;
    showAddress?: boolean;
    address?: ReactNode;
    addressesTitle?: string;
    icon?: ReactNode;
    isLoading?: boolean;
}

const HeaderRecipientItemLayout = ({
    button,
    label,
    showAddress = true,
    address,
    addressesTitle,
    icon,
    isLoading = false
}: Props) => {
    return (
        <span
            className={classnames([
                'flex flex-items-center flex-nowrap message-recipient-item',
                isLoading ? 'flex-item-fluid' : 'is-appearing-content'
            ])}
        >
            <span className="container-to container-to--item noprint">{button}</span>
            <span
                className={classnames([
                    'flex flex-nowrap',
                    showAddress && 'onmobile-flex-column',
                    isLoading && 'flex-item-fluid'
                ])}
            >
                <span className="message-recipient-item-label ellipsis">{label}</span>
                {showAddress && (
                    <span
                        className={classnames([
                            'message-recipient-item-address opacity-50 ml0-5 onmobile-ml0 ellipsis',
                            !isLoading && 'flex flex-nowrap'
                        ])}
                        title={addressesTitle}
                    >
                        {address}
                    </span>
                )}
                {icon}
            </span>
        </span>
    );
};

export default HeaderRecipientItemLayout;
