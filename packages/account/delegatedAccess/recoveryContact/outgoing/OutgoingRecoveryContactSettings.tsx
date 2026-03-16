import { c, msgid } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { Pill } from '@proton/atoms/Pill/Pill';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Loader from '@proton/components/components/loader/Loader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { DelegatedAccessStateEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import { getFormattedAccessibleAtDate } from '../../emergencyContact/date';
import { ContactCell } from '../../shared/ContactCell';
import {
    type OutgoingDelegatedAccessProviderValue,
    useOutgoingController,
} from '../../shared/OutgoingDelegatedAccessProvider';
import { getMetaOutgoingDelegatedAccess } from '../../shared/outgoing/helper';
import type { MetaIncomingDelegatedAccess } from '../../shared/outgoing/interface';

type ItemValue = OutgoingDelegatedAccessProviderValue['items']['recoveryContacts'][0];

interface OutgoingItemProps {
    labels: string[];
    value: ItemValue;
    notify: OutgoingDelegatedAccessProviderValue['notify'];
    meta: MetaIncomingDelegatedAccess;
}

const StatusCell = ({
    value: {
        parsedOutgoingDelegatedAccess: { isDisabled, recoverableAtDate },

        outgoingDelegatedAccess,
    },
    meta: { canRecoverStep2 },
}: Pick<OutgoingItemProps, 'value' | 'meta'>) => {
    if (canRecoverStep2) {
        const formattedTime = getFormattedAccessibleAtDate(recoverableAtDate);
        return (
            <div className="flex items-center justify-start gap-1">
                <Pill color="#164616" backgroundColor="#C9E9C9" rounded="rounded-sm" className="text-semibold">
                    {c('emergency_access').t`Approved request`}
                </Pill>
                {formattedTime}
            </div>
        );
    }
    if (outgoingDelegatedAccess.State === DelegatedAccessStateEnum.Recoverable) {
        return (
            <Pill color="#5C3700" backgroundColor="#F5D4A2" rounded="rounded-sm" className="text-semibold">
                {c('emergency_access').t`Pending request`}
            </Pill>
        );
    }
    if (isDisabled) {
        return (
            <Pill color="#5C5958" backgroundColor="#E5E4E1" rounded="rounded-sm" className="text-semibold">
                {c('emergency_access').t`Disabled`}
            </Pill>
        );
    }
};

const OutgoingItem = ({
    notify,
    labels,
    value,
    value: {
        parsedOutgoingDelegatedAccess: { contact, createdAtDate, isDisabled },
        loading,
    },
    meta,
    meta: { canReEnable, canDelete, canRecoverStep1, canRecoverStep2 },
}: OutgoingItemProps) => {
    const hasStatusCell =
        canRecoverStep2 || value.outgoingDelegatedAccess.State === DelegatedAccessStateEnum.Recoverable || isDisabled;

    return (
        <TableRow labels={labels}>
            <TableCell colSpan={hasStatusCell ? undefined : 2}>
                <ContactCell {...contact} createdAtDate={createdAtDate} />
            </TableCell>
            {hasStatusCell && (
                <TableCell>
                    <StatusCell value={value} meta={meta} />
                </TableCell>
            )}
            <TableCell>
                <div className="inline-flex">
                    <DropdownActions
                        list={[
                            canRecoverStep1 && {
                                text: c('emergency_access').t`Send recovery request`,
                                onClick: () => notify({ type: 'recover', value }),
                                loading: loading.recover,
                            },
                            canRecoverStep2 && {
                                text: c('emergency_access').t`Recover data`,
                                onClick: () => notify({ type: 'recover-token', value }),
                                loading: loading.recoverToken,
                            },
                            canReEnable && {
                                text: c('emergency_access').t`Enable`,
                                onClick: () => notify({ type: 'enable-recovery-contact', value }),
                                loading: loading.enable,
                            },
                            canDelete && {
                                text: c('Action').t`Remove`,
                                onClick: () => notify({ type: 'delete-recovery-contact', value }),
                            },
                        ].filter(isTruthy)}
                        size="small"
                    />
                </div>
            </TableCell>
        </TableRow>
    );
};

const OutgoingTable = ({ controller }: { controller: OutgoingDelegatedAccessProviderValue }) => {
    const headerCells = [
        { title: c('Title').t`Name`, className: 'w-1/3' },
        { title: c('Title').t`Status`, className: 'w-1/3' },
        { title: c('Title').t`Actions` },
    ];
    const labels = headerCells.map((column) => column.title);

    return (
        <Table
            hasActions
            responsive="stacked"
            className="mb-0"
            lastRowNoBorder
            noInlinePadding
            data-testid="outgoing-recovery-contact-table"
        >
            <TableHeader className="sr-only">
                <TableRow>
                    {headerCells.map(({ title, className }) => (
                        <TableHeaderCell key={title} className={className}>
                            {title}
                        </TableHeaderCell>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody loading={controller.loading} colSpan={3}>
                {controller.items.recoveryContacts.map((value) => {
                    const meta = getMetaOutgoingDelegatedAccess({
                        // `now` doesn't matter for recovery contacts, use 0
                        now: 0,
                        value,
                        userContext: controller.meta.userContext,
                    });
                    return (
                        <OutgoingItem
                            key={value.outgoingDelegatedAccess.DelegatedAccessID}
                            labels={labels}
                            value={value}
                            meta={meta}
                            notify={controller.notify}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export const OutgoingRecoveryContactSettings = ({
    userHasNoAccountRecoveryMethodSet,
}: {
    userHasNoAccountRecoveryMethodSet: boolean;
}) => {
    const isRecoverySettingsRedesignEnabled = useFlag('RecoverySettingsRedesign');
    const controller = useOutgoingController();

    if (!controller.meta.available) {
        return null;
    }

    const limit = controller.meta.recoveryContacts.limit;
    const canAddRecoveryContact =
        controller.meta.recoveryContacts.hasAccess && !controller.meta.recoveryContacts.hasReachedLimit;

    if (isRecoverySettingsRedesignEnabled) {
        if (controller.loading) {
            return <Loader />;
        }

        return (
            <>
                {canAddRecoveryContact && (
                    <div className="mb-2">
                        <Button
                            disabled={userHasNoAccountRecoveryMethodSet}
                            color="norm"
                            className="inline-flex gap-2 items-center"
                            onClick={() => {
                                controller.notify({ type: 'add', value: 'recovery-contact' });
                            }}
                        >
                            <IcPlus className="shrink-0" />
                            {c('emergency_access').t`Add recovery contact`}
                        </Button>
                    </div>
                )}

                {controller.items.recoveryContacts.length > 0 && (
                    <DashboardCard>
                        <DashboardCardContent>
                            <h3 className="text-semibold text-rg mb-3">{c('emergency_access')
                                .t`Your recovery contacts`}</h3>
                            {controller.meta.recoveryContacts.hasReachedLimit && (
                                <Banner variant="info">
                                    {c('emergency_access').ngettext(
                                        msgid`Maximum of ${limit} contact reached. To change, remove a contact and add a new one.`,
                                        `Maximum of ${limit} contacts reached. To change, remove a contact and add a new one.`,
                                        limit
                                    )}
                                </Banner>
                            )}
                            <OutgoingTable controller={controller} />
                        </DashboardCardContent>
                    </DashboardCard>
                )}
            </>
        );
    }

    return (
        <>
            <div className="text-semibold text-xl mb-3">{c('emergency_access').t`Your recovery contacts`}</div>
            <SettingsParagraph>
                {c('emergency_access').t`People you have added as recovery contacts.`}
            </SettingsParagraph>
            <div className="mb-4">
                {canAddRecoveryContact && (
                    <Button
                        disabled={userHasNoAccountRecoveryMethodSet}
                        color="norm"
                        onClick={() => {
                            controller.notify({ type: 'add', value: 'recovery-contact' });
                        }}
                    >{c('emergency_access').t`Add recovery contact`}</Button>
                )}
            </div>
            {(controller.items.recoveryContacts.length > 0 || controller.loading) && (
                <OutgoingTable controller={controller} />
            )}
        </>
    );
};
