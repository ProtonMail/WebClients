import { FormEvent, useEffect, useState } from 'react';

import { useConfirmModal } from 'proton-drive/src/app/components/modals/ConfirmationModal';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Radio, Tooltip } from '@proton/components/components';
import RevisionsUpgradeBanner from '@proton/components/components/drive/RevisionsUpgradeBanner';
import { useApi, useLoading, useNotifications, useUser } from '@proton/components/hooks';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/userSettings';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DEFAULT_PAID_USER_SETTINGS, DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import type { RevisionRetentionDaysSetting, UserSettings } from '@proton/shared/lib/interfaces/drive/userSettings';
import clsx from '@proton/utils/clsx';

type UserSettingsResponse = { UserSettings: Partial<UserSettings> };

const RetentionDaysSection = () => {
    const api = useApi();

    const [{ hasPaidDrive }] = useUser();
    const [isLoading, withLoading] = useLoading();
    const [isSubmitLoading, withSubmitLoading] = useLoading();
    const [confirmModal, showConfirmModal] = useConfirmModal();
    const { createNotification } = useNotifications();
    const defaultUserRetentionsDays = hasPaidDrive
        ? DEFAULT_PAID_USER_SETTINGS.RevisionRetentionDays
        : DEFAULT_USER_SETTINGS.RevisionRetentionDays;
    const [originalRevisionRetentionDays, setOriginalRevisionRetentionDays] =
        useState<RevisionRetentionDaysSetting>(defaultUserRetentionsDays);
    const [revisionRetentionDays, setRevisionRetentionDay] =
        useState<RevisionRetentionDaysSetting>(defaultUserRetentionsDays);
    const retentionLabel = (nbDays: RevisionRetentionDaysSetting) => c('Label').t`${nbDays} days`;

    const options: {
        value: RevisionRetentionDaysSetting;
        label: string;
        disabled?: boolean;
    }[] = [
        {
            value: 0,
            label: c('Label').t`Don't keep versions`,
            disabled: !hasPaidDrive,
        },
        { value: 7, label: retentionLabel(7) },
        { value: 30, label: retentionLabel(30), disabled: !hasPaidDrive },
        { value: 180, label: retentionLabel(180), disabled: !hasPaidDrive },
        { value: 365, label: retentionLabel(365), disabled: !hasPaidDrive },
        { value: 3650, label: c('Label').t`Indefinitely`, disabled: !hasPaidDrive },
    ];

    useEffect(() => {
        if (!hasPaidDrive) {
            return;
        }
        void withLoading(
            api<UserSettingsResponse>(queryUserSettings()).then(({ UserSettings }) => {
                if (UserSettings.RevisionRetentionDays) {
                    setOriginalRevisionRetentionDays(UserSettings.RevisionRetentionDays);
                    setRevisionRetentionDay(UserSettings.RevisionRetentionDays);
                }
                return;
            })
        );
    }, [hasPaidDrive]);

    const handleChange = (newRevisionRetentionDay: RevisionRetentionDaysSetting) => {
        setRevisionRetentionDay(newRevisionRetentionDay);
    };

    const updateRevisionRetentionDay = () => {
        return withSubmitLoading(
            api<UserSettingsResponse>(
                queryUpdateUserSettings({
                    RevisionRetentionDays: revisionRetentionDays,
                })
            )
        )
            .then(() => {
                createNotification({
                    text: c('Info').t`Settings updated`,
                });
                setOriginalRevisionRetentionDays(revisionRetentionDays);
            })
            .catch(() => {
                createNotification({
                    type: 'error',
                    text: c('Info').t`Settings update failed`,
                });
                setRevisionRetentionDay(originalRevisionRetentionDays);
            });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (originalRevisionRetentionDays > revisionRetentionDays) {
            void showConfirmModal({
                title: c('Title').t`Delete versioning history?`,
                onSubmit: updateRevisionRetentionDay,
                onCancel: () => setRevisionRetentionDay(originalRevisionRetentionDays),
                size: 'medium',
                message: c('Info')
                    .t`This will delete all previous versions of your files. ${DRIVE_APP_NAME} will no longer keep previous versions of your files.`,
                submitText: c('Action').t`Delete and confirm`,
            });
        } else {
            void updateRevisionRetentionDay();
        }
    };

    return (
        <div className="w500p">
            {!hasPaidDrive ? <RevisionsUpgradeBanner /> : null}
            <form className="flex flex-column flex-align-items-start flex-gap-0-5 mt-6" onSubmit={handleSubmit}>
                {options.map((option) => {
                    const id = option.value.toString();
                    const radioProps = {
                        onChange: () => handleChange(option.value),
                        id,
                        name: option.label,
                        disabled: isLoading || isSubmitLoading || option.disabled,
                        checked: !isLoading && revisionRetentionDays === option.value,
                        className: clsx(
                            'w100 block border rounded p-3',
                            !isLoading && revisionRetentionDays === option.value ? 'border-primary' : 'border-norm'
                        ),
                    };

                    if (option.value !== 7 && !hasPaidDrive) {
                        return (
                            <Tooltip key={id} title={c('Info').t`Upgrade to unlock`} originalPlacement="right">
                                <div className="w100">
                                    <Radio {...radioProps}>{option.label}</Radio>
                                </div>
                            </Tooltip>
                        );
                    }
                    return (
                        <Radio key={id} {...radioProps}>
                            {option.label}
                        </Radio>
                    );
                })}
                <Button
                    className="mt-6"
                    type="submit"
                    size="large"
                    color="norm"
                    loading={isSubmitLoading}
                    disabled={originalRevisionRetentionDays === revisionRetentionDays}
                >{c('Action').t`Save changes`}</Button>
            </form>
            {confirmModal}
        </div>
    );
};

export default RetentionDaysSection;
