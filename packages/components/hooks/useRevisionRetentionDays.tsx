import { FormEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/userSettings';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DEFAULT_PAID_USER_SETTINGS, DEFAULT_USER_SETTINGS } from '@proton/shared/lib/drive/constants';
import type { RevisionRetentionDaysSetting, UserSettings } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useConfirmActionModal } from '../components/confirmActionModal';
import { getRetentionLabel } from '../containers/drive/settings/retentionLabels';
import useApi from './useApi';
import useLoading from './useLoading';
import useNotifications from './useNotifications';

type UserSettingsResponse = { UserSettings: Partial<UserSettings> };

const useRevisionRetentionDays = (
    hasPaidDrive: boolean,
    showConfirmActionModal: ReturnType<typeof useConfirmActionModal>['1']
) => {
    const api = useApi();
    const [isLoading, withLoading] = useLoading(hasPaidDrive);
    const [isSubmitLoading, withSubmitLoading] = useLoading();
    const { createNotification } = useNotifications();
    const defaultUserRetentionsDays = hasPaidDrive
        ? DEFAULT_PAID_USER_SETTINGS.RevisionRetentionDays
        : DEFAULT_USER_SETTINGS.RevisionRetentionDays;
    const [originalRevisionRetentionDays, setOriginalRevisionRetentionDays] =
        useState<RevisionRetentionDaysSetting>(defaultUserRetentionsDays);
    const [revisionRetentionDays, setRevisionRetentionDay] =
        useState<RevisionRetentionDaysSetting>(defaultUserRetentionsDays);

    const hasValueChanged = originalRevisionRetentionDays !== revisionRetentionDays;

    useEffect(() => {
        if (!hasPaidDrive) {
            return;
        }
        void withLoading(
            api<UserSettingsResponse>(queryUserSettings()).then(({ UserSettings }) => {
                if (UserSettings.RevisionRetentionDays !== null && UserSettings.RevisionRetentionDays !== undefined) {
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
            .catch((err) => {
                createNotification({
                    type: 'error',
                    text: c('Info').t`Settings update failed`,
                });
                setRevisionRetentionDay(originalRevisionRetentionDays);
                console.error('Settings update failed.', err);
            });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (originalRevisionRetentionDays > revisionRetentionDays) {
            const rententionLabel = getRetentionLabel(revisionRetentionDays);
            const message =
                revisionRetentionDays === 0
                    ? [
                          c('Info').t`This will delete all previous versions of your files.`,
                          <br />,
                          c('Info').jt`${DRIVE_APP_NAME} will no longer keep previous versions of your files.`,
                      ]
                    : c('Info').t`This will delete all previous versions of your files older than ${rententionLabel}.`;
            void showConfirmActionModal({
                title: c('Title').t`Delete version history?`,
                onSubmit: updateRevisionRetentionDay,
                onCancel: () => setRevisionRetentionDay(originalRevisionRetentionDays),
                size: 'medium',
                message,
                submitText: c('Action').t`Delete and confirm`,
            });
        } else {
            void updateRevisionRetentionDay();
        }
    };

    return {
        revisionRetentionDays,
        hasValueChanged,
        isLoading,
        isSubmitLoading,
        handleChange,
        handleSubmit,
    };
};

export default useRevisionRetentionDays;
