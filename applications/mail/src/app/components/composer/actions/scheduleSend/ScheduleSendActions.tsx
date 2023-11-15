import { forwardRef, useMemo } from 'react';

import { Locale, addDays, addSeconds, format, fromUnixTime, getUnixTime, nextMonday, set } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    DropdownMenu,
    DropdownMenuButton,
    SimpleDropdown,
    UpsellModal,
    useModalState,
} from '@proton/components/components';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { YEAR_REGEX } from '@proton/shared/lib/date/date';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { dateLocale } from '@proton/shared/lib/i18n';
import plusLogo from '@proton/styles/assets/img/illustrations/mail-plus-logo.svg';
import clsx from '@proton/utils/clsx';

import { FUTURE_MESSAGES_BUFFER } from '../../../../constants';
import { isScheduledDuringNight } from './helpers';
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

const EIGHT_AM = {
    hours: 8,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
};

const ScheduleSendActions = ({
    onDisplayScheduleSendModal,
    onScheduleSend,
    scheduledAtUnixTimestamp,
    onUpsellModalShow,
}: Omit<Props, 'onDropdownToggle' | 'loading'> & { onUpsellModalShow: () => void }) => {
    const { canScheduleSendCustom } = useScheduleSendFeature();
    const actions = useMemo(() => {
        const now = new Date();
        const isNight = isScheduledDuringNight();
        const scheduledAt = scheduledAtUnixTimestamp ? fromUnixTime(scheduledAtUnixTimestamp) : undefined;
        const today8am = set(now, EIGHT_AM);
        const tomorrow8am = set(addDays(now, 1), EIGHT_AM);
        const monday8am = set(nextMonday(now), EIGHT_AM);

        const list: Actions = [
            {
                title: isNight
                    ? // translator: Full sentence is: 'In the morning | February 14th at 8:00'
                      c('Action').t`In the morning`
                    : // translator: Full sentence is: 'Tomorrow | February 14th at 8:00'
                      c('Action').t`Tomorrow`,
                testId: 'composer:schedule-send:tomorrow',
                value: isNight ? formatDate(today8am, dateLocale) : formatDate(tomorrow8am, dateLocale),
                onSubmit: () =>
                    isNight ? onScheduleSend(getUnixTime(today8am)) : onScheduleSend(getUnixTime(tomorrow8am)),
            },
            {
                title: c('Action').t`Monday`,
                testId: 'composer:schedule-send:next-monday',
                value: formatDate(monday8am, dateLocale),
                onSubmit: () => onScheduleSend(getUnixTime(monday8am)),
            },
            {
                title: (
                    <div className="flex flex-justify-start flex-align-items-center">
                        <span className="pr-2">{c('Action').t`Custom`}</span>
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

        const minScheduleTime = addSeconds(now, FUTURE_MESSAGES_BUFFER);
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
            <div className="p-4 pt-3 mb-2 border-bottom">
                <h6 data-testid="composer:schedule-send:dropdown-title" className="text-bold">{c('Title')
                    .t`Schedule send`}</h6>
                <p className={clsx('m-0', 'color-weak')}>{c('Description')
                    .t`When do you want your message to be sent?`}</p>
            </div>
            <DropdownMenu>
                {actions.map((action) => (
                    <DropdownMenuButton
                        key={action.testId}
                        className="flex flex-align-items-center flex-justify-space-between flex-nowrap gap-4"
                        data-testid={action.testId}
                        onClick={action.onSubmit}
                    >
                        <span className="flex-item-fluid text-left">{action.title}</span>
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

        const upsellRef = getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: MAIL_UPSELL_PATHS.SCHEDULE_SEND,
        });

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
                    dropdownStyle={{ '--min-width': '23em', '--custom-max-width': '95vw' }}
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
                {renderUpsellModal && (
                    <UpsellModal
                        data-testid="composer:schedule-send:upsell-modal"
                        title={c('Title').t`Set your own schedule`}
                        description={c('Description')
                            .t`Unlock custom message scheduling and other benefits when you upgrade your plan.`}
                        modalProps={upsellModalProps}
                        upsellRef={upsellRef}
                        features={[
                            'schedule-messages',
                            'auto-delete-trash-and-spam',
                            'unlimited-folders-and-labels',
                            'search-message-content',
                            'more-storage',
                            'more-email-addresses',
                            'custom-email-domains',
                            'email-aliases',
                        ]}
                    />
                )}
            </>
        );
    }
);
ScheduleSendActionsWrapper.displayName = 'ScheduleSendActionsWrapper';

export default ScheduleSendActionsWrapper;
