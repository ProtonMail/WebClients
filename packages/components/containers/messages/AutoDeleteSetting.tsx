import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

import useModalState from '../../components/modalTwo/useModalState';
import UpsellIcon from '../../components/upsell/UpsellIcon';
import AutoDeleteUpsellModal from '../../components/upsell/modals/AutoDeleteUpsellModal';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
import AutoDeleteSpamAndTrashDaysToggle from './AutoDeleteSpamAndTrashDaysToggle';

interface Props {
    onSaved: () => void;
    settingValue: AUTO_DELETE_SPAM_AND_TRASH_DAYS | null;
}

const AutoDeleteSetting = ({ settingValue = AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED, onSaved }: Props) => {
    const api = useApi();
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

    return (
        <>
            {renderUpsellModal && <AutoDeleteUpsellModal modalProps={upsellModalProps} />}

            <SettingsToggleRow
                id="autoDelete"
                label={
                    <>
                        <SettingsToggleRow.Label>
                            {c('Label').t`Auto-delete trash and spam`}
                            {!hasPaidMail && <UpsellIcon />}
                        </SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Tooltip')
                                .t`Delete trash and spam messages after 30 days. Turning on auto-delete gives messages already in trash/spam a deletion date based on the date they were moved there.`}
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={
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
                }
            />
        </>
    );
};

export default AutoDeleteSetting;
