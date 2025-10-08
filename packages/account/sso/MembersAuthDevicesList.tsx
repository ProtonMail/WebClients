import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import Icon from '@proton/components/components/icon/Icon';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

import AuthDeviceItem from './AuthDeviceItem';
import type { PendingAdminActivation, PendingAdminActivations } from './memberAuthDevices';

interface Props {
    pendingAdminActivationsWithMembers: PendingAdminActivations;
    loading: boolean;
    loadingMap: SimpleMap<boolean>;
    onApprove: (pendingAdminActivation: PendingAdminActivation) => void;
    onReject: (pendingAdminActivation: PendingAdminActivation) => void;
}

const MembersAuthDevicesList = ({
    onApprove,
    onReject,
    pendingAdminActivationsWithMembers,
    loading,
    loadingMap,
}: Props) => {
    return (
        <Table hasActions responsive="cards">
            <TableHeader cells={[c('Title').t`User`, c('Title').t`Device`, c('Title').t`Actions`]} />
            <TableBody loading={loading} colSpan={3}>
                {pendingAdminActivationsWithMembers.map((pendingAdminActivation) => {
                    const { member, memberAuthDevice } = pendingAdminActivation;
                    const key = `${member.ID}-${memberAuthDevice.ID}`;

                    const activationMemberAddress = member.Addresses?.find((memberAddress) => {
                        return memberAddress?.ID === memberAuthDevice.ActivationAddressID;
                    });
                    const memberAddress = activationMemberAddress || member.Addresses?.[0];
                    const memberName = member.Name;
                    const memberEmail = memberAddress?.Email || memberName;

                    return (
                        <TableRow
                            key={key}
                            labels={[c('Title').t`User`, c('Title').t`Device`, c('Title').t`Actions`]}
                            cells={[
                                <>
                                    <div className="text-bold text-break">{memberName}</div>
                                    {memberEmail !== memberName && (
                                        <div className="color-weak text-break" title={memberEmail}>
                                            {memberEmail}
                                        </div>
                                    )}
                                </>,
                                <AuthDeviceItem authDevice={memberAuthDevice} padding={false} />,
                                <ButtonGroup size="small" individualButtonColor={true}>
                                    <Button onClick={() => onApprove(pendingAdminActivation)}>
                                        <div className="flex items-center flex-nowrap gap-1">
                                            <Icon name="checkmark" className="shrink-0" />
                                            <span className="text-ellipsis">{c('sso').t`Grant`}</span>
                                        </div>
                                    </Button>
                                    <Button
                                        color="danger"
                                        onClick={() => onReject(pendingAdminActivation)}
                                        loading={loadingMap[pendingAdminActivation.memberAuthDevice.ID]}
                                    >
                                        <div className="flex items-center flex-nowrap gap-1">
                                            <Icon name="cross" className="shrink-0" />
                                            <span className="text-ellipsis">{c('sso').t`Deny`}</span>
                                        </div>
                                    </Button>
                                </ButtonGroup>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default MembersAuthDevicesList;
