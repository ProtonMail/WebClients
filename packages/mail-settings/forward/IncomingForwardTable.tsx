import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import { getSettingsCardTableProps } from '@proton/components/containers/account/getSettingsCardTableProps';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { IncomingAddressForwarding } from '@proton/shared/lib/interfaces/AddressForwarding';

import ForwardStatus from './ForwardStatus';
import IncomingForwardActions from './IncomingForwardActions';
import WarningChainedForwarding from './WarningChainedForwarding';

interface Props {
    addresses: Address[];
    loading?: boolean;
    forwardings: IncomingAddressForwarding[];
    chainedEmails: string[];
    /** The card variant styles the table to fill a flush settings card. */
    variant?: SettingsLayoutVariant;
}

const IncomingForwardTable = ({ addresses, loading, forwardings, chainedEmails, variant }: Props) => {
    const cardTable = variant === SettingsLayoutVariant.Card ? getSettingsCardTableProps() : undefined;
    return (
        <Table responsive="cards" hasActions={!!forwardings.length} {...cardTable}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`From`}</TableHeaderCell>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`To`}</TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '11em' }}>{c(
                        'email_forwarding_2023: Header'
                    ).t`Status`}</TableHeaderCell>
                    <TableHeaderCell
                        // In the card, the column fits its buttons, which stay on one line (see the cell below)
                        className={cardTable ? undefined : 'w-custom'}
                        style={cardTable ? undefined : { '--w-custom': '9em' }}
                    >{c('email_forwarding_2023: Header').t`Actions`}</TableHeaderCell>
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
                                <ForwardStatus forwardingConfig={forward} />
                            </TableCell>
                            <TableCell className={cardTable ? 'text-nowrap' : undefined}>
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
