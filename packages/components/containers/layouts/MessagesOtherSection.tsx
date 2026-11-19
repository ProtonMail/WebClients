import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import {
    updateDraftType,
    updateFontFace,
    updateFontSize,
    updateRemoveImageMetadata,
    updateRightToLeft,
} from '@proton/shared/lib/api/mailSettings';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import {
    DEFAULT_FONT_FACE,
    DEFAULT_FONT_SIZE,
    getFontFaceIdFromValue,
    getFontFaceValueFromId,
} from '@proton/shared/lib/mail/fontFace';
import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import { SettingsCardRows } from '../account/SettingsCardRows';
import { SettingsSelectRow } from '../account/SettingsSelectRow';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
import DelaySendSecondsSelect from '../messages/DelaySendSecondsSelect';
import RemoveImageMetadataToggle from '../messages/RemoveImageMetadataToggle';
import DraftTypeSelect from './DraftTypeSelect';
import FontFaceSelect from './FontFaceSelect';
import FontSizeSelect from './FontSizeSelect';
import TextDirectionSelect from './TextDirectionSelect';

const MessagesOtherSection = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [{ DraftMIMEType, RightToLeft, FontFace, FontSize, DelaySendSeconds, RemoveImageMetadata }] =
        useMailSettings();
    const fontFaceValue = getFontFaceValueFromId(FontFace) || DEFAULT_FONT_FACE;
    const { createNotification } = useNotifications();

    const [loadingDraftType, withLoadingDraftType] = useLoading();
    const [loadingRightToLeft, withLoadingRightToLeft] = useLoading();
    const [loadingFontFace, withLoadingFontFace] = useLoading();
    const [loadingFontSize, withLoadingFontSize] = useLoading();
    const [loadingRemoveImageMetadata, withLoadingRemoveImageMetadata] = useLoading();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleChangeDraftType = async (value: MIME_TYPES) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateDraftType(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleChangeRightToLeft = async (value: DIRECTION) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateRightToLeft(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleChangeFontFace = async (value: string) => {
        const fontFaceId = getFontFaceIdFromValue(value);
        if (fontFaceId) {
            const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateFontFace(fontFaceId));
            dispatch(mailSettingsActions.updateMailSettings(MailSettings));
            notifyPreferenceSaved();
        }
    };

    const handleChangeFontSize = async (value: number) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateFontSize(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    const handleRemoveImageMetadata = async (value: boolean) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateRemoveImageMetadata(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        notifyPreferenceSaved();
    };

    return (
        <SettingsCardRows>
            <SettingsSelectRow
                id="draftType"
                label={<SettingsSelectRow.Label>{c('Label').t`Composer mode`}</SettingsSelectRow.Label>}
                select={
                    <DraftTypeSelect
                        id="draftType"
                        draftType={DraftMIMEType}
                        onChange={(value) => withLoadingDraftType(handleChangeDraftType(value))}
                        loading={loadingDraftType}
                        data-testid="appearance:draft-type-select"
                    />
                }
            />
            <SettingsSelectRow
                id="textDirection"
                label={<SettingsSelectRow.Label>{c('Label').t`Composer text direction`}</SettingsSelectRow.Label>}
                select={
                    <TextDirectionSelect
                        id="textDirection"
                        rightToLeft={RightToLeft}
                        onChange={(value) => withLoadingRightToLeft(handleChangeRightToLeft(value))}
                        loading={loadingRightToLeft}
                        data-testid="appearance:text-direction-select"
                    />
                }
            />
            <SettingsSelectRow
                id="fontFace"
                label={
                    <SettingsSelectRow.Label id="label-composer-default-font-size">
                        {c('Label').t`Composer default font/size`}
                    </SettingsSelectRow.Label>
                }
                select={
                    <div className="flex flex-nowrap gap-2">
                        <div className="flex-1 min-w-0">
                            <FontFaceSelect
                                id="fontFace"
                                aria-labelledby="label-composer-default-font-size"
                                fontFace={fontFaceValue}
                                onChange={(value) => withLoadingFontFace(handleChangeFontFace(value))}
                                loading={loadingFontFace}
                            />
                        </div>
                        <div className="shrink-0">
                            <FontSizeSelect
                                id="fontSize"
                                aria-labelledby="label-composer-default-font-size"
                                fontSize={FontSize || DEFAULT_FONT_SIZE}
                                onChange={(value) => withLoadingFontSize(handleChangeFontSize(value))}
                                loading={loadingFontSize}
                            />
                        </div>
                    </div>
                }
            />
            <SettingsSelectRow
                id="delaySendSecondsSelect"
                label={
                    <>
                        <SettingsSelectRow.Label>{c('Label').t`Undo send`}</SettingsSelectRow.Label>
                        <SettingsSelectRow.Description>
                            {c('Tooltip')
                                .t`This feature delays sending your emails, giving you the opportunity to undo send during the selected time frame.`}
                        </SettingsSelectRow.Description>
                    </>
                }
                select={<DelaySendSecondsSelect id="delaySendSecondsSelect" delaySendSeconds={DelaySendSeconds} />}
            />
            <SettingsToggleRow
                id="removeImageMetadata"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Remove image metadata`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Tooltip').t`Remove metadata from images to protect your privacy.`}
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={
                    <RemoveImageMetadataToggle
                        id="removeImageMetadata"
                        removeImageMetadata={RemoveImageMetadata}
                        loading={loadingRemoveImageMetadata}
                        onChange={(newValue) => withLoadingRemoveImageMetadata(handleRemoveImageMetadata(newValue))}
                    />
                }
            />
        </SettingsCardRows>
    );
};

export default MessagesOtherSection;
