import React from 'react';

import { c } from 'ttag';

import UpsellIcon from '@proton/components/components/upsell/UpsellIcon';
import { useLoading } from '@proton/hooks';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import { AutoDeleteSpamAndTrashDaysSetting } from '@proton/shared/lib/interfaces';

import { AutoDeleteUpsellModal, Info, Toggle, useModalState } from '../../components';
import { useApi, useEventManager, useFeature, useUser } from '../../hooks';
import { SettingsLayout, SettingsLayoutLeft, SettingsLayoutRight } from '../account';
import { FeatureCode } from '../features';

interface Props {
    onSaved: () => void;
    settingValue: AutoDeleteSpamAndTrashDaysSetting;
}

const AutoDeleteSetting = ({ settingValue, onSaved }: Props) => {
    const api = useApi();
    const { feature: autoDeleteFeature } = useFeature(FeatureCode.AutoDelete);
    const [{ hasPaidMail }, userLoading] = useUser();
    const { call } = useEventManager();

    const [loadingAutoDelete, withLoadingAutoDelete] = useLoading();
    const [upsellModalProps, toggleUpsellModal, renderUpsellModal] = useModalState();

    const handleChangeAutoDelete = async (autoDelete: AutoDeleteSpamAndTrashDaysSetting) => {
        await api(updateAutoDelete(autoDelete));
        await call();
        onSaved();
    };

    const disabled = userLoading || !hasPaidMail;

    return autoDeleteFeature?.Value === true ? (
        <>
            {renderUpsellModal && <AutoDeleteUpsellModal modalProps={upsellModalProps} />}

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="autoDelete" className="text-semibold flex flex-nowrap flex-align-items-start">
                        <span className="mr-2 flex-item-fluid">
                            <span className="mr-2">{c('Label').t`Auto-delete unwanted messages`}</span>
                            <Info
                                className="flex-item-noshrink"
                                title={c('Tooltip')
                                    .t`Delete trash and spam messages after 30 days. Turning on auto-delete gives messages already in trash/spam a deletion date based on the date they were moved there.`}
                            />
                        </span>
                        {!hasPaidMail && <UpsellIcon className="mt-1" />}
                    </label>
                </SettingsLayoutLeft>

                <SettingsLayoutRight className="pt-2">
                    <Toggle
                        id="autoDelete"
                        loading={loadingAutoDelete}
                        checked={!!settingValue}
                        onChange={({ target }) => {
                            /* Didn't used disabled attr because need to catch label and input click */
                            if (disabled) {
                                toggleUpsellModal(true);
                                return;
                            }
                            void withLoadingAutoDelete(
                                handleChangeAutoDelete(
                                    target.checked
                                        ? AutoDeleteSpamAndTrashDaysSetting.ACTIVE
                                        : AutoDeleteSpamAndTrashDaysSetting.DISABLED
                                )
                            );
                        }}
                        data-testid="message-setting:auto-delete-toggle"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    ) : null;
};

export default AutoDeleteSetting;
