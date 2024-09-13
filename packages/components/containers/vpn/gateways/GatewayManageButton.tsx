import { c, msgid } from 'ttag';

import { usePopperAnchor } from '@proton/components/components';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';

import type { Gateway } from './Gateway';
import type { GatewayLogical } from './GatewayLogical';

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

        return c('Title').ngettext(
            msgid`Delete the server (you will still be able to recover it for ${days} day)`,
            `Delete the server (you will still be able to recover it for ${days} days)`,
            days
        );
    })();
    const loading = deletingLogicals.indexOf(logical.ID) !== -1;
    const disabled = Boolean(deletedLogicals[logical.ID]);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                icon
                title={c('Title').t`Open actions dropdown`}
                size="small"
            >
                <Icon name="three-dots-vertical" />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-end">
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
            </Dropdown>
        </>
    );
};

export default GatewayManageButton;
