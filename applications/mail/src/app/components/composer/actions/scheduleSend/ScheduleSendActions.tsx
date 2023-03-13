import React, { forwardRef, useMemo } from 'react';

import { Locale, addDays, addSeconds, format, fromUnixTime, getUnixTime, nextMonday } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenu, DropdownMenuButton, SimpleDropdown, useModalState } from '@proton/components/components';
import { YEAR_REGEX } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';
import plusLogo from '@proton/styles/assets/img/illustrations/mail-plus-logo.svg';
import clsx from '@proton/utils/clsx';

import { SCHEDULED_SEND_BUFFER } from '../../../../constants';
import ComposerScheduleSendUpsellModal from './UpsellModal/ScheduleSendUpsellModal';
import useScheduleSendFeature from './useScheduleSendFeature';

interface Props {
    loading: boolean;
    onDisplayScheduleSendModal: () => void;
    onDropdownToggle: (isOpen: boolean) => void;
    onScheduleSend: (scheduledAt: number) => void;
    scheduledAtUnixTimestamp: number | undefined;
}

type Actions = {
    title: string | JSX.Element;
    testId: string;
    value: string;
    onSubmit: () => void;
}[];

const formatDate = (initialDate: number | Date, locale: Locale) =>
    format(initialDate, 'PPPp', { locale }).replace(YEAR_REGEX, '').replace(',', '');

const ScheduleSendActions = ({
    onDisplayScheduleSendModal,
    onScheduleSend,
    scheduledAtUnixTimestamp,
    onUpsellModalShow,
}: Omit<Props, 'onDropdownToggle' | 'loading'> & { onUpsellModalShow: () => void }) => {
    const { canScheduleSendCustom } = useScheduleSendFeature();
    const actions = useMemo(() => {
        const now = new Date();
        const scheduledAt = scheduledAtUnixTimestamp ? fromUnixTime(scheduledAtUnixTimestamp) : undefined;
        const tomorrow = addDays(now, 1).setHours(8, 0, 0, 0);
        const monday = nextMonday(now).setHours(8, 0, 0, 0);

        const list: Actions = [
            {
                title: c('Action').t`Tomorrow`,
                testId: 'composer:schedule-send:tomorrow',
                value: formatDate(tomorrow, dateLocale),
                onSubmit: () => onScheduleSend(getUnixTime(tomorrow)),
            },
            {
                title: c('Action').t`Monday`,
                testId: 'composer:schedule-send:next-monday',
                value: formatDate(monday, dateLocale),
                onSubmit: () => onScheduleSend(getUnixTime(monday)),
            },
            {
                title: (
                    <div className="flex flex-justify-start flex-align-items-center">
                        <span className="pr0-5">{c('Action').t`Custom`}</span>
                        {!canScheduleSendCustom && (
                            <span>
                                <img src={plusLogo} alt="Protonmail plus logo" />
                            </span>
                        )}
                    </div>
                ),
                testId: 'composer:schedule-send:custom',
                value: '',
                onSubmit: canScheduleSendCustom ? onDisplayScheduleSendModal : onUpsellModalShow,
            },
        ];

        const minScheduleTime = addSeconds(now, SCHEDULED_SEND_BUFFER);
        const isScheduledAfterLimit = minScheduleTime && scheduledAt && scheduledAt > minScheduleTime;

        if (isScheduledAfterLimit) {
            list.unshift({
                title: c('Action').t`As Scheduled`,
                testId: 'composer:schedule-send-as-scheduled',
                value: formatDate(scheduledAt, dateLocale),
                onSubmit: () => onScheduleSend(getUnixTime(scheduledAt)),
            });
        }

        return list;
    }, [canScheduleSendCustom]);

    return (
        <>
            <div className="p1 pt0-75 mb0-5 border-bottom">
                <h6 data-testid="composer:schedule-send:dropdown-title" className="text-bold">{c('Title')
                    .t`Schedule send`}</h6>
                <p className={clsx('m0', 'color-weak')}>{c('Description')
                    .t`When do you want your message to be sent?`}</p>
            </div>
            <DropdownMenu>
                {actions.map((action) => (
                    <DropdownMenuButton
                        key={action.testId}
                        className="flex flex-align-items-center flex-justify-space-between"
                        data-testid={action.testId}
                        onClick={action.onSubmit}
                    >
                        <span className="text-left">{action.title}</span>
                        <span className="text-right color-weak">{action.value}</span>
                    </DropdownMenuButton>
                ))}
            </DropdownMenu>
        </>
    );
};

const ScheduleSendActionsWrapper = forwardRef<HTMLElement, Props>(
    (
        {
            loading,
            onScheduleSend,
            onDisplayScheduleSendModal,
            scheduledAtUnixTimestamp: scheduledAt,
            onDropdownToggle,
            ...rest
        },
        ref
    ) => {
        const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();
        const handleShowUpsellModal = () => {
            handleUpsellModalDisplay(true);
        };

        return (
            <>
                <SimpleDropdown
                    as={Button}
                    className="flex-item-noshrink composer-actions-secondary"
                    data-testid="composer:scheduled-send:open-dropdown"
                    icon
                    loading={loading}
                    onToggle={onDropdownToggle}
                    originalPlacement="bottom-end"
                    ref={ref}
                    title={c('Title').t`Open actions dropdown`}
                    // contains buttonGroup props
                    {...rest}
                >
                    <ScheduleSendActions
                        onDisplayScheduleSendModal={onDisplayScheduleSendModal}
                        onScheduleSend={onScheduleSend}
                        scheduledAtUnixTimestamp={scheduledAt}
                        onUpsellModalShow={handleShowUpsellModal}
                    />
                </SimpleDropdown>
                {renderUpsellModal && <ComposerScheduleSendUpsellModal {...upsellModalProps} />}
            </>
        );
    }
);
ScheduleSendActionsWrapper.displayName = 'ScheduleSendActionsWrapper';

export default ScheduleSendActionsWrapper;
