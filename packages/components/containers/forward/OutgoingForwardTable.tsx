import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import type { Address, OutgoingAddressForwarding, UserModel } from '@proton/shared/lib/interfaces';

import ForwardStatus from './ForwardStatus';
import OutgoingForwardActions from './OutgoingForwardActions';
import WarningChainedForwarding from './WarningChainedForwarding';

interface Props {
    addresses: Address[];
    loading?: boolean;
    forwardings: OutgoingAddressForwarding[];
    user: UserModel;
    chainedEmails: string[];
}

const OutgoingForwardTable = ({ addresses, loading, forwardings, chainedEmails, user }: Props) => {
    return (
        <Table responsive="cards" hasActions={!!forwardings.length}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`From`}</TableHeaderCell>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`To`}</TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '11em' }}>{c(
                        'email_forwarding_2023: Header'
                    ).t`Status`}</TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '5em' }}>{c(
                        'email_forwarding_2023: Header'
                    ).t`Actions`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody loading={loading} colSpan={4}>
                {forwardings.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">{c('email_forwarding_2023: Info')
                            .t`No outgoing forwarding rules`}</TableCell>
                    </TableRow>
                )}
                {forwardings.map((forward) => {
                    const to = forward.ForwardeeEmail;
                    const fromAddress = addresses.find(({ ID }) => ID === forward.ForwarderAddressID);

                    if (fromAddress === undefined) {
                        return null;
                    }

                    const from = fromAddress.Email;

                    return (
                        <TableRow key={forward.ID}>
                            <TableCell label={c('email_forwarding_2023: Header').t`From`}>
                                <div className="text-ellipsis">
                                    <WarningChainedForwarding chainedEmails={chainedEmails} forwardEmail={from} />
                                    <span title={from}>{from}</span>
                                </div>
                            </TableCell>
                            <TableCell label={c('email_forwarding_2023: Header').t`To`}>
                                <div className="text-ellipsis" title={to}>
                                    {to}
                                </div>
                            </TableCell>
                            <TableCell label={c('email_forwarding_2023: Header').t`Status`}>
                                <ForwardStatus forward={forward} />
                            </TableCell>
                            <TableCell>
                                <OutgoingForwardActions
                                    addresses={addresses}
                                    user={user}
                                    forward={forward}
                                    forwardings={forwardings}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default OutgoingForwardTable;
