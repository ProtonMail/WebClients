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
import type { OutgoingAddressForwarding } from '@proton/shared/lib/interfaces/AddressForwarding';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import ForwardStatus from './ForwardStatus';
import OutgoingForwardActions from './OutgoingForwardActions';
import WarningChainedForwarding from './WarningChainedForwarding';
import { getIsLastOutgoingE2EEForwarding, getIsLastOutgoingNonE2EEForwarding } from './forwardHelper';

interface Props {
    addresses: Address[];
    loading?: boolean;
    outgoingAddressForwardings: OutgoingAddressForwarding[];
    user: UserModel;
    chainedEmails: string[];
    /** The card variant styles the table to fill a flush settings card. */
    variant?: SettingsLayoutVariant;
}

const OutgoingForwardTable = ({
    addresses,
    loading,
    outgoingAddressForwardings,
    chainedEmails,
    user,
    variant,
}: Props) => {
    const cardTable = variant === SettingsLayoutVariant.Card ? getSettingsCardTableProps() : undefined;
    return (
        <Table responsive="cards" hasActions={outgoingAddressForwardings.length > 0} {...cardTable}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`Forward from`}</TableHeaderCell>
                    <TableHeaderCell>{c('email_forwarding_2023: Header').t`Forward to`}</TableHeaderCell>
                    <TableHeaderCell className="w-custom" style={{ '--w-custom': '11em' }}>{c(
                        'email_forwarding_2023: Header'
                    ).t`Status`}</TableHeaderCell>
                    <TableHeaderCell
                        // In the card, the column fits its buttons, which stay on one line (see the cell below)
                        className={cardTable ? undefined : 'w-custom'}
                        style={cardTable ? undefined : { '--w-custom': '5em' }}
                    >{c('email_forwarding_2023: Header').t`Actions`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody loading={loading} colSpan={4}>
                {outgoingAddressForwardings.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">{c('email_forwarding_2023: Info')
                            .t`No outgoing forwarding rules`}</TableCell>
                    </TableRow>
                )}
                {outgoingAddressForwardings.map((forwardingConfig) => {
                    const to = forwardingConfig.ForwardeeEmail;
                    const fromAddress = addresses.find(({ ID }) => ID === forwardingConfig.ForwarderAddressID);

                    if (fromAddress === undefined) {
                        return null;
                    }

                    const from = fromAddress.Email;

                    return (
                        <TableRow key={forwardingConfig.ID}>
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
                                <ForwardStatus forwardingConfig={forwardingConfig} />
                            </TableCell>
                            <TableCell className={cardTable ? 'text-nowrap' : undefined}>
                                <OutgoingForwardActions
                                    addresses={addresses}
                                    user={user}
                                    existingForwardingConfig={forwardingConfig}
                                    isLastOutgoingNonE2EEForwarding={getIsLastOutgoingNonE2EEForwarding(
                                        forwardingConfig,
                                        outgoingAddressForwardings
                                    )}
                                    isLastOutgoingE2EEForwarding={getIsLastOutgoingE2EEForwarding(
                                        forwardingConfig,
                                        outgoingAddressForwardings
                                    )}
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
