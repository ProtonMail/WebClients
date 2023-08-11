import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ButtonGroup, DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown } from '@proton/components/components';

import { Gateway } from './Gateway';
import { GatewayLogical } from './GatewayLogical';

interface Props {
    gateway: Gateway;
    logical: GatewayLogical;
    deleted: boolean;
    deletingLogicals: readonly string[];
    deletedLogicals: Record<string, boolean>;
    renameGateway: (id: string, name: string) => () => any;
    editGatewayServers: (gateway: Gateway, logical: GatewayLogical) => () => any;
    editGatewayUsers: (gateway: Gateway, logical: GatewayLogical) => () => any;
    deleteGateway: (gateway: Gateway) => () => any;
}

export const GatewayManageButton = ({
    gateway,
    logical,
    renameGateway = () => () => {},
    editGatewayServers = () => () => {},
    editGatewayUsers = () => () => {},
    deleteGateway = () => () => {},
    deletingLogicals,
    deletedLogicals,
    deleted = false,
}: Props) => {
    const deleteServerTitle = (() => {
        const days = 7;

        return c('Title').t`Delete the server (you will still be able to recover it for ${days} days)`;
    })();
    const loading = (deletingLogicals.indexOf(logical.ID) !== -1);
    const disabled = Boolean(deletedLogicals[logical.ID]);

    return (
        <ButtonGroup style={{ minWidth: '38px' }}>
            {c('Action').t`Manage`}
            <SimpleDropdown
                icon
                as={Button}
                originalPlacement="bottom-end"
                title={c('Title').t`Open actions dropdown`}
                hasCaret={false}
                content={<Icon name="three-dots-vertical" />}
            >
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left"
                        loading={loading}
                        disabled={disabled}
                        onClick={renameGateway(logical.ID, logical.Name.replace(/#\d+$/, '').replace(/-\d+$/, ''))}
                        title={c('Title').t`Rename the gateway`}
                    >
                        <Icon name="pen" className="mr-2" />
                        {c('Action').t`Edit name`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left"
                        loading={loading}
                        disabled={disabled}
                        onClick={editGatewayServers(gateway, logical)}
                        title={c('Title').t`Edit the list of servers of the gateway`}
                    >
                        <Icon name="servers" className="mr-2" />
                        {c('Action').t`Edit servers`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left"
                        loading={loading}
                        disabled={disabled}
                        onClick={editGatewayUsers(gateway, logical)}
                        title={c('Title').t`Edit who can access the gateway`}
                    >
                        <Icon name="users" className="mr-2" />
                        {c('Action').t`Edit users`}
                    </DropdownMenuButton>
                    {!deleted && (
                        <>
                            <div className="dropdown-item-hr" key="hr-more-options" />
                            <DropdownMenuButton
                                className="text-left color-danger"
                                loading={loading}
                                onClick={deleteGateway(gateway)}
                                title={deleteServerTitle}
                            >
                                <Icon name="trash" className="mr-2" />
                                {c('Action').t`Delete`}
                            </DropdownMenuButton>
                        </>
                    )}
                </DropdownMenu>
            </SimpleDropdown>
        </ButtonGroup>
    );
};

export default GatewayManageButton;
