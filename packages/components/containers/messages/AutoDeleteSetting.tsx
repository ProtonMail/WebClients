import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import AutoDeleteUpsellModal from '@proton/components/components/upsell/modals/AutoDeleteUpsellModal';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import useApi from '@proton/components/hooks/useApi';
import { FeatureCode, useFeature } from '@proton/features';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

import AutoDeleteSpamAndTrashDaysToggle from './AutoDeleteSpamAndTrashDaysToggle';

interface Props {
    onSaved: () => void;
    settingValue: AUTO_DELETE_SPAM_AND_TRASH_DAYS | null;
}

const AutoDeleteSetting = ({ settingValue = AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED, onSaved }: Props) => {
    const api = useApi();
    const { feature: autoDeleteFeature } = useFeature(FeatureCode.AutoDelete);
    const [{ hasPaidMail }, userLoading] = useUser();
    const dispatch = useDispatch();

    const [loadingAutoDelete, withLoadingAutoDelete] = useLoading();
    const [upsellModalProps, toggleUpsellModal, renderUpsellModal] = useModalState();

    const handleChangeAutoDelete = async (autoDelete: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateAutoDelete(autoDelete));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        onSaved();
    };

    const disabled = userLoading || !hasPaidMail;

    return autoDeleteFeature?.Value === true ? (
        <>
            {renderUpsellModal && <AutoDeleteUpsellModal modalProps={upsellModalProps} />}

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="autoDelete" className="text-semibold flex flex-nowrap items-start">
                        <span className="mr-2 flex-1">
                            <span className="mr-2">{c('Label').t`Auto-delete unwanted messages`}</span>
                            <Info
                                className="shrink-0"
                                title={c('Tooltip')
                                    .t`Delete trash and spam messages after 30 days. Turning on auto-delete gives messages already in trash/spam a deletion date based on the date they were moved there.`}
                            />
                        </span>
                        {!hasPaidMail && <UpsellIcon className="mt-1" />}
                    </label>
                </SettingsLayoutLeft>

                <SettingsLayoutRight isToggleContainer>
                    <AutoDeleteSpamAndTrashDaysToggle
                        id="autoDelete"
                        loading={loadingAutoDelete}
                        autoDeleteSpamAndTrashDays={settingValue}
                        onToggle={(newValue: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
                            /* Didn't used disabled attr because need to catch label and input click */
                            if (disabled) {
                                toggleUpsellModal(true);
                                return;
                            }
                            void withLoadingAutoDelete(handleChangeAutoDelete(newValue));
                        }}
                        dataTestID="message-setting:auto-delete-toggle"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    ) : null;
};

export default AutoDeleteSetting;
