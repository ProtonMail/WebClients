import { c, msgid } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import withPermissionGuard from '@proton/components/components/orgPermissions/withPermissionGuard';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcServers } from '@proton/icons/icons/IcServers';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcUsers } from '@proton/icons/icons/IcUsers';

import type { Gateway, GatewayLogical } from '../../types/Gateway';

const GuardedUpdateMenuButton = withPermissionGuard('account.gateway.update')(DropdownMenuButton);
const GuardedDeleteMenuButton = withPermissionGuard('account.gateway.delete')(DropdownMenuButton);
const menuTooltip = { wrapperClassName: 'block' };

interface Props {
    gateway: Gateway;
    logical: GatewayLogical;
    deleted: boolean;
    deletingLogicals: readonly string[];
    deletedLogicals: Record<string, boolean>;
    renameGateway: (id: string, name: string) => () => any;
    editGatewayServers: (gateway: Gateway, logical: GatewayLogical) => () => any;
    editGatewayUsers: (gateway: Gateway, logical: GatewayLogical) => () => any;
    deleteGateway: () => void;
}

export const GatewayManageButton = ({
    gateway,
    logical,
    renameGateway = () => () => {},
    editGatewayServers = () => () => {},
    editGatewayUsers = () => () => {},
    deleteGateway,
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
                <IcThreeDotsVertical />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom-end">
                <DropdownMenu>
                    <GuardedUpdateMenuButton
                        className="text-left"
                        loading={loading}
                        disabled={disabled}
                        onClick={renameGateway(logical.ID, logical.Name.replace(/#\d+$/, '').replace(/-\d+$/, ''))}
                        title={c('Title').t`Rename the gateway`}
                        tooltip={menuTooltip}
                    >
                        <IcPen className="mr-2" />
                        {c('Action').t`Edit name`}
                    </GuardedUpdateMenuButton>
                    <GuardedUpdateMenuButton
                        className="text-left"
                        loading={loading}
                        disabled={disabled}
                        onClick={editGatewayServers(gateway, logical)}
                        title={c('Title').t`Edit the list of servers of the gateway`}
                        tooltip={menuTooltip}
                    >
                        <IcServers className="mr-2" />
                        {c('Action').t`Edit servers`}
                    </GuardedUpdateMenuButton>
                    <GuardedUpdateMenuButton
                        className="text-left"
                        loading={loading}
                        disabled={disabled}
                        onClick={editGatewayUsers(gateway, logical)}
                        title={c('Title').t`Edit who can access the gateway`}
                        tooltip={menuTooltip}
                    >
                        <IcUsers className="mr-2" />
                        {c('Action').t`Edit users`}
                    </GuardedUpdateMenuButton>
                    {!deleted && (
                        <>
                            <div className="dropdown-item-hr" key="hr-more-options" />
                            <GuardedDeleteMenuButton
                                className="text-left color-danger"
                                loading={loading}
                                onClick={deleteGateway}
                                title={deleteServerTitle}
                                tooltip={menuTooltip}
                            >
                                <IcTrash className="mr-2" />
                                {c('Action').t`Delete`}
                            </GuardedDeleteMenuButton>
                        </>
                    )}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
