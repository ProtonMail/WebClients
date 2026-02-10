import { c, msgid } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Pill } from '@proton/atoms/Pill/Pill';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import isTruthy from '@proton/utils/isTruthy';

import { useUserSettings } from '../../../userSettings/hooks';
import { getFormattedAccessibleAtDate } from '../../emergencyContact/date';
import { DelegatedAccessStateEnum } from '../../interface';
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
        parsedOutgoingDelegatedAccess: { contact, createdAtDate },
        loading,
    },
    meta,
    meta: { canReEnable, canDelete, canRecoverStep1, canRecoverStep2 },
}: OutgoingItemProps) => {
    return (
        <TableRow labels={labels}>
            <TableCell>
                <ContactCell {...contact} createdAtDate={createdAtDate} />
            </TableCell>
            <TableCell>
                <StatusCell value={value} meta={meta} />
            </TableCell>
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
        <Table hasActions responsive="cards" data-testid="outgoing-recovery-contact-table">
            <TableHeader>
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

export const OutgoingRecoveryContactSettings = ({ accountRecoveryId }: { accountRecoveryId: string | null }) => {
    const controller = useOutgoingController();
    const [userSettings] = useUserSettings();

    if (!controller.meta.available) {
        return null;
    }

    const showWarning = Boolean(
        userSettings &&
        // If email reset is enabled and set
        !(
            (userSettings.Email.Reset && userSettings.Email.Value) ||
            // If phone reset is enabled and set
            (userSettings.Phone.Reset && userSettings.Phone.Value)
        )
    );

    return (
        <>
            <div className="text-semibold text-xl mb-3">{c('emergency_access').t`Your recovery contacts`}</div>
            <SettingsParagraph>
                {c('emergency_access')
                    .t`By adding people you trust as recovery contacts, we'll be able to send them an email to help you if you're having trouble to recover your data after a password reset. You can also be a recovery contact for others.`}
            </SettingsParagraph>
            {showWarning && !!accountRecoveryId && (
                <div className="mb-4">
                    <Banner
                        action={
                            <Button
                                onClick={() => {
                                    document.getElementById(accountRecoveryId)?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >{c('emergency_access').t`Set account recovery`}</Button>
                        }
                    >
                        {c('emergency_access')
                            .t`To use trusted contact recovery, you must have an account recovery method set.`}
                    </Banner>
                </div>
            )}
            <div className="mb-4">
                {(() => {
                    if (controller.meta.recoveryContacts.hasReachedLimit) {
                        const limit = controller.meta.recoveryContacts.limit;
                        return (
                            <Banner>
                                {c('emergency_access').ngettext(
                                    msgid`You reached the maximum of ${limit} recovery contact.`,
                                    `You reached the maximum of ${limit} recovery contacts.`,
                                    limit
                                )}
                            </Banner>
                        );
                    }

                    if (controller.meta.recoveryContacts.hasAccess) {
                        return (
                            <Button
                                disabled={showWarning}
                                color="norm"
                                onClick={() => {
                                    controller.notify({ type: 'add', value: 'recovery-contact' });
                                }}
                            >{c('emergency_access').t`Add recovery contact`}</Button>
                        );
                    }
                })()}
            </div>
            {(controller.items.recoveryContacts.length > 0 || controller.loading) && (
                <OutgoingTable controller={controller} />
            )}
        </>
    );
};
