import { c } from 'ttag';

import { SidebarExpandButton } from '@proton/components';

import './WalletExpandButton.scss';

interface Props {
    className?: string;
    expanded: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
}

export const WalletExpandButton = (props: Props) => {
    const title = props.expanded ? c('Action').t`Collapse wallets` : c('Action').t`Expand wallets`;
    return <SidebarExpandButton className="wallet-expand-button" size={4} title={title} pill {...props} />;
};
