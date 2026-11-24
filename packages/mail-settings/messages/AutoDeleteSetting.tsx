import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import AutoDeleteUpsellModal from '@proton/components/components/upsell/modals/AutoDeleteUpsellModal';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

import AutoDeleteSpamAndTrashDaysToggle from './AutoDeleteSpamAndTrashDaysToggle';

interface Props {
    settingValue: AUTO_DELETE_SPAM_AND_TRASH_DAYS | null;
}

const AutoDeleteSetting = ({ settingValue = AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED }: Props) => {
    const [{ hasPaidMail }, userLoading] = useUser();
    const { update, isLoading } = useUpdateMailSetting();

    const [upsellModalProps, toggleUpsellModal, renderUpsellModal] = useModalState();

    const handleChangeAutoDelete = (autoDelete: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
        update('AutoDeleteSpamAndTrashDays', autoDelete);
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
                        loading={isLoading('AutoDeleteSpamAndTrashDays')}
                        autoDeleteSpamAndTrashDays={settingValue}
                        onToggle={(newValue: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => {
                            /* Didn't used disabled attr because need to catch label and input click */
                            if (disabled) {
                                toggleUpsellModal(true);
                                return;
                            }
                            handleChangeAutoDelete(newValue);
                        }}
                        dataTestID="message-setting:auto-delete-toggle"
                    />
                }
            />
        </>
    );
};

export default AutoDeleteSetting;
