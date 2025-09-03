import { c } from 'ttag';

import { getFontFaceIdFromValue, getFontFaceValueFromId } from '@proton/components/components/editor/helpers/fontFace';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
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
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '../../components/editor/constants';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import DelaySendSecondsSelect from '../messages/DelaySendSecondsSelect';
import RemoveImageMetadataToggle from '../messages/RemoveImageMetadataToggle';
import DraftTypeSelect from './DraftTypeSelect';
import FontFaceSelect from './FontFaceSelect';
import FontSizeSelect from './FontSizeSelect';
import TextDirectionSelect from './TextDirectionSelect';

const MessagesOtherSection = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [
        {
            DraftMIMEType,
            RightToLeft,
            FontFace,
            FontSize,
            DelaySendSeconds,
            RemoveImageMetadata,
        } = DEFAULT_MAILSETTINGS,
    ] = useMailSettings();
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
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <Label htmlFor="draftType" className="text-semibold">
                        {c('Label').t`Composer mode`}
                    </Label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <DraftTypeSelect
                        id="draftType"
                        draftType={DraftMIMEType}
                        onChange={(value) => withLoadingDraftType(handleChangeDraftType(value))}
                        loading={loadingDraftType}
                        data-testid="appearance:draft-type-select"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="textDirection" className="text-semibold">
                        {c('Label').t`Composer text direction`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <TextDirectionSelect
                        id="textDirection"
                        rightToLeft={RightToLeft}
                        onChange={(value) => withLoadingRightToLeft(handleChangeRightToLeft(value))}
                        loading={loadingRightToLeft}
                        data-testid="appearance:text-direction-select"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="fontFace" id="label-composer-default-font-size" className="text-semibold">
                        {c('Label').t`Composer default font/size`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="settings-layout-right-fixed-size flex flex-row">
                    <div className="flex-1 pr-2">
                        <FontFaceSelect
                            id="fontFace"
                            aria-describedby="label-composer-default-font-size"
                            fontFace={fontFaceValue}
                            onChange={(value) => withLoadingFontFace(handleChangeFontFace(value))}
                            loading={loadingFontFace}
                        />
                    </div>
                    <div className="shrink-0">
                        <FontSizeSelect
                            id="fontSize"
                            aria-describedby="label-composer-default-font-size"
                            fontSize={FontSize || DEFAULT_FONT_SIZE}
                            onChange={(value) => withLoadingFontSize(handleChangeFontSize(value))}
                            loading={loadingFontSize}
                        />
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="delaySendSecondsSelect" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Undo send`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`This feature delays sending your emails, giving you the opportunity to undo send during the selected time frame.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <DelaySendSecondsSelect id="delaySendSecondsSelect" delaySendSeconds={DelaySendSeconds} />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="removeImageMetadata" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Remove image metadata`}</span>
                        <Info title={c('Tooltip').t`Remove metadata from images to protect your privacy.`} />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <RemoveImageMetadataToggle
                        id="removeImageMetadata"
                        removeImageMetadata={RemoveImageMetadata}
                        loading={loadingRemoveImageMetadata}
                        onChange={(newValue) => withLoadingRemoveImageMetadata(handleRemoveImageMetadata(newValue))}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default MessagesOtherSection;
