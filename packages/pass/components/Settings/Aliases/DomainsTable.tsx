import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Badge, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@proton/components/index';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { selectUserPlan } from '@proton/pass/store/selectors';
import type { CustomDomainOutput } from '@proton/pass/types';

type Props = {
    domains: CustomDomainOutput[];
    openModalDNS: (domain: CustomDomainOutput) => void;
    handleRemoveDomainClick: (domain: CustomDomainOutput) => void;
};

const getDomainStatusLabel = ({ OwnershipVerified, MxVerified }: CustomDomainOutput) => {
    if (!OwnershipVerified) {
        return c('Title').t`Unverified`;
    }
    if (!MxVerified) {
        return c('Info').t`Unconfigured`;
    }
    return null;
};

export const DomainsTable: FC<Props> = ({ domains, handleRemoveDomainClick, openModalDNS }) => {
    const canManageAlias = useSelector(selectUserPlan)?.ManageAlias;

    return (
        <>
            <Table responsive="cards" hasActions>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="w-1/2">{c('Title').t`Domain`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title').t`Aliases`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title').t`Status`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title').t`Actions`}</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {domains.map((domain) => {
                        const statusLabel = getDomainStatusLabel(domain);
                        return (
                            <TableRow key={domain.ID}>
                                <TableCell>{domain.Domain}</TableCell>
                                <TableCell>{domain.AliasCount}</TableCell>
                                <TableCell>{statusLabel && <Badge type="primary">{statusLabel}</Badge>}</TableCell>
                                <TableCell>
                                    <div className="flex justify-end">
                                        <QuickActionsDropdown
                                            icon="three-dots-horizontal"
                                            color="weak"
                                            shape="solid"
                                            size="small"
                                            className="button-xs ui-purple"
                                            pill={false}
                                            originalPlacement="bottom-end"
                                            disabled={!canManageAlias}
                                        >
                                            <DropdownMenuButton
                                                label={c('Action').t`Check DNS`}
                                                onClick={() => openModalDNS(domain)}
                                            />
                                            <DropdownMenuButton
                                                label={c('Action').t`Delete`}
                                                onClick={() => handleRemoveDomainClick(domain)}
                                            />
                                        </QuickActionsDropdown>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};
