import { c } from 'ttag';

import { Address, IncomingAddressForwarding } from '@proton/shared/lib/interfaces';

import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../../components';
import ForwardStatus from './ForwardStatus';
import IncomingForwardActions from './IncomingForwardActions';
import WarningChainedForwarding from './WarningChainedForwarding';

interface Props {
    addresses: Address[];
    loading?: boolean;
    forwardings: IncomingAddressForwarding[];
    chainedEmails: string[];
}

const IncomingForwardTable = ({ addresses, loading, forwardings, chainedEmails }: Props) => {
    return (
        <Table responsive="cards" hasActions={!!forwardings.length}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`From`}</TableHeaderCell>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`To`}</TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '11em' }}>{c(
                        'email_forwarding_2023: Header'
                    ).t`Status`}</TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '9em' }}>{c(
                        'email_forwarding_2023: Header'
                    ).t`Actions`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody loading={loading} colSpan={4}>
                {forwardings.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">{c('email_forwarding_2023: Info')
                            .t`No incoming forwarding rules`}</TableCell>
                    </TableRow>
                )}
                {forwardings.map((forward) => {
                    const from = forward.ForwarderEmail;
                    const toAddress = addresses.find(({ ID }) => ID === forward.ForwardeeAddressID);
                    if (toAddress === undefined) {
                        return null;
                    }
                    const to = toAddress.Email;
                    return (
                        <TableRow key={forward.ID}>
                            <TableCell label={c('email_forwarding_2023: Header').t`From`}>
                                <div className="text-ellipsis" title={from}>
                                    {from}
                                </div>
                            </TableCell>
                            <TableCell label={c('email_forwarding_2023: Header').t`To`}>
                                <div className="text-ellipsis">
                                    <WarningChainedForwarding chainedEmails={chainedEmails} forwardEmail={to} />
                                    <span title={to}>{to}</span>
                                </div>
                            </TableCell>
                            <TableCell label={c('email_forwarding_2023: Header').t`Status`}>
                                <ForwardStatus forward={forward} />
                            </TableCell>
                            <TableCell>
                                <IncomingForwardActions forward={forward} addresses={addresses} />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default IncomingForwardTable;
