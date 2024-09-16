import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import { queryUpdateUserSettings, queryUserSettings } from '@proton/shared/lib/api/drive/user';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import type {
    RevisionRetentionDaysSetting,
    UserSettingsResponse,
} from '@proton/shared/lib/interfaces/drive/userSettings';

import type { useConfirmActionModal } from '../../components/confirmActionModal';
import { getRetentionLabel } from '../../containers/drive/settings/retentionLabels';
import useApi from '../useApi';
import useNotifications from '../useNotifications';

export const useRevisionRetentionDays = (
    hasPaidDrive: boolean,
    showConfirmActionModal: ReturnType<typeof useConfirmActionModal>['1']
) => {
    const api = useApi();
    const [isLoading, withLoading] = useLoading(hasPaidDrive);
    const [isSubmitLoading, withSubmitLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [originalRevisionRetentionDays, setOriginalRevisionRetentionDays] = useState<RevisionRetentionDaysSetting>();
    const [revisionRetentionDays, setRevisionRetentionDay] = useState<RevisionRetentionDaysSetting>();

    const hasValueChanged = originalRevisionRetentionDays !== revisionRetentionDays;

    useEffect(() => {
        void withLoading(
            api<UserSettingsResponse>(queryUserSettings()).then(({ UserSettings, Defaults }) => {
                if (
                    UserSettings.RevisionRetentionDays !== null &&
                    UserSettings.RevisionRetentionDays !== undefined &&
                    hasPaidDrive
                ) {
                    setOriginalRevisionRetentionDays(UserSettings.RevisionRetentionDays);
                    setRevisionRetentionDay(UserSettings.RevisionRetentionDays);
                } else {
                    setOriginalRevisionRetentionDays(Defaults.RevisionRetentionDays);
                    setRevisionRetentionDay(Defaults.RevisionRetentionDays);
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
        if (revisionRetentionDays === undefined) {
            return;
        }
        if (originalRevisionRetentionDays && originalRevisionRetentionDays > revisionRetentionDays) {
            const rententionLabel = getRetentionLabel(revisionRetentionDays);
            const message =
                revisionRetentionDays === 0
                    ? [
                          c('Info').t`This will delete all previous versions of your files.`,
                          <br />,
                          c('Info').jt`${DRIVE_APP_NAME} will no longer keep previous versions of your files.`,
                      ]
                    : c('Info').t`This will delete all previous versions of your files older than ${rententionLabel}.`;
            showConfirmActionModal({
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
