import React, { ReactNode } from 'react';
import { classnames } from 'react-components';

interface Props {
    button?: ReactNode;
    label?: ReactNode;
    showAddress?: boolean;
    address?: ReactNode;
    title?: string;
    icon?: ReactNode;
    isLoading?: boolean;
}

const RecipientItemLayout = ({ button, label, showAddress = true, address, title, icon, isLoading = false }: Props) => {
    return (
        <span
            className={classnames([
                'flex flex-items-center flex-nowrap message-recipient-item',
                isLoading ? 'flex-item-fluid' : 'is-appearing-content',
            ])}
        >
            <span className="container-to container-to--item noprint">{button}</span>
            <span
                className={classnames([
                    'flex flex-items-center flex-nowrap ellipsis mw100',
                    isLoading && 'flex-item-fluid',
                ])}
            >
                <span
                    className="flex-item-fluid message-recipient-item-label-address ellipsis mw100 inbl"
                    title={title}
                >
                    <span className={classnames(['message-recipient-item-label', isLoading && 'inbl'])}>{label}</span>
                    {
                        ` ` /** I need a real space in source here, as everything is inline, no margin/padding to have correct ellipsis applied :-| * */
                    }
                    {showAddress && (
                        <span
                            className={classnames(['message-recipient-item-address opacity-50', isLoading && 'inbl'])}
                        >
                            {address}
                        </span>
                    )}
                </span>
                {icon}
            </span>
        </span>
    );
};

export default RecipientItemLayout;
