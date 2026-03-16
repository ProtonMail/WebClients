import { c } from 'ttag';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { Pill } from '@proton/atoms/Pill/Pill';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { DelegatedAccessStateEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import { ContactCell } from '../../shared/ContactCell';
import {
    type IncomingDelegatedAccessProviderValue,
    useIncomingController,
} from '../../shared/IncomingDelegatedAccessProvider';
import { getMetaIncomingDelegatedAccess } from '../../shared/incoming/helper';
import type { MetaIncomingDelegatedAccess } from '../../shared/incoming/interface';

type ItemValue = IncomingDelegatedAccessProviderValue['items']['recoveryContacts'][0];

interface IncomingItemProps {
    value: ItemValue;
    notify: IncomingDelegatedAccessProviderValue['notify'];
    labels: string[];
    meta: MetaIncomingDelegatedAccess;
}

const IncomingDelegatedAccessActions = ({
    value,
    meta: { canDelete, canRecover },
    notify,
}: Pick<IncomingItemProps, 'value' | 'meta' | 'notify'>) => {
    return (
        <div className="inline-flex">
            <DropdownActions
                list={[
                    canRecover && {
                        text: c('emergency_access').t`See request`,
                        onClick: () => notify({ type: 'recover', value }),
                    },
                    canDelete && {
                        actionType: 'delete' as const,
                        text: c('emergency_access').t`Stop being recovery contact`,
                        onClick: () => notify({ type: 'delete-recovery-contact', value }),
                    },
                ].filter(isTruthy)}
                size="small"
            />
        </div>
    );
};

const StatusCell = ({
    value: {
        parsedIncomingDelegatedAccess: { isDisabled },
        incomingDelegatedAccess,
    },
}: Pick<IncomingItemProps, 'value' | 'meta'>) => {
    if (
        incomingDelegatedAccess.State === DelegatedAccessStateEnum.Recoverable &&
        !incomingDelegatedAccess.RecoveryToken
    ) {
        return (
            <Pill color="#5C3700" backgroundColor="#F5D4A2" rounded="rounded-sm" className="text-semibold">
                {c('emergency_access').t`Asking for help`}
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

const IncomingItem = ({
    value,
    value: {
        parsedIncomingDelegatedAccess: { contact, createdAtDate, isDisabled },
    },
    meta,
    labels,
    notify,
}: IncomingItemProps) => {
    const hasStatusCell =
        (value.incomingDelegatedAccess.State === DelegatedAccessStateEnum.Recoverable &&
            !value.incomingDelegatedAccess.RecoveryToken) ||
        isDisabled;

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
                <IncomingDelegatedAccessActions value={value} meta={meta} notify={notify} />
            </TableCell>
        </TableRow>
    );
};

const IncomingTable = ({ controller }: { controller: IncomingDelegatedAccessProviderValue }) => {
    const headerCells = [
        { title: c('Title').t`Name`, className: 'w-1/3' },
        { title: c('Title').t`Status`, className: 'w-1/3' },
        { title: c('Title').t`Actions` },
    ];

    const headerLabels = headerCells.map((cell) => cell.title);
    const now = Date.now();

    return (
        <Table
            hasActions
            responsive="stacked"
            lastRowNoBorder
            noInlinePadding
            className="mb-0"
            data-testid="incoming-recovery-contact-table"
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
                    const meta = getMetaIncomingDelegatedAccess({ now, value });
                    return (
                        <IncomingItem
                            key={value.incomingDelegatedAccess.DelegatedAccessID}
                            labels={headerLabels}
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

export const IncomingRecoveryContactSettings = () => {
    const isRecoverySettingsRedesignEnabled = useFlag('RecoverySettingsRedesign');
    const controller = useIncomingController();

    if (isRecoverySettingsRedesignEnabled) {
        if (controller.loading || !controller.items.recoveryContacts.length) {
            return null;
        }

        return (
            <DashboardCard>
                <DashboardCardContent>
                    <h3 className="text-semibold text-rg mb-3">
                        {c('emergency_access').t`People who have you as a recovery contact`}
                    </h3>
                    <IncomingTable controller={controller} />
                </DashboardCardContent>
            </DashboardCard>
        );
    }

    return (
        <>
            <div className="text-semibold text-xl mb-3">
                {c('emergency_access').t`People who have you as a recovery contact`}
            </div>
            {!controller.items.recoveryContacts.length && !controller.loading ? (
                <SettingsParagraph>
                    {c('emergency_access').t`You have not been designated as a recovery contact for anyone yet.`}
                </SettingsParagraph>
            ) : (
                <IncomingTable controller={controller} />
            )}
        </>
    );
};
