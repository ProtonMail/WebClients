import { c } from 'ttag';

import { SettingsCardRows } from '@proton/components/containers/account/SettingsCardRows';
import { SettingsSelectRow } from '@proton/components/containers/account/SettingsSelectRow';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import {
    DEFAULT_FONT_FACE,
    DEFAULT_FONT_SIZE,
    getFontFaceIdFromValue,
    getFontFaceValueFromId,
} from '@proton/shared/lib/mail/fontFace';
import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import DelaySendSecondsSelect from '../messages/DelaySendSecondsSelect';
import RemoveImageMetadataToggle from '../messages/RemoveImageMetadataToggle';
import DraftTypeSelect from './DraftTypeSelect';
import FontFaceSelect from './FontFaceSelect';
import FontSizeSelect from './FontSizeSelect';
import TextDirectionSelect from './TextDirectionSelect';

const MessagesOtherSection = () => {
    const { update, isLoading } = useUpdateMailSetting();
    const [{ DraftMIMEType, RightToLeft, FontFace, FontSize, DelaySendSeconds, RemoveImageMetadata }] =
        useMailSettings();
    const fontFaceValue = getFontFaceValueFromId(FontFace) || DEFAULT_FONT_FACE;

    const handleChangeDraftType = (value: MIME_TYPES) => {
        update('DraftMIMEType', value);
    };

    const handleChangeRightToLeft = (value: DIRECTION) => {
        update('RightToLeft', value);
    };

    const handleChangeFontFace = (value: string) => {
        const fontFaceId = getFontFaceIdFromValue(value);
        if (fontFaceId) {
            update('FontFace', fontFaceId);
        }
    };

    const handleChangeFontSize = (value: number) => {
        update('FontSize', value);
    };

    const handleRemoveImageMetadata = (value: boolean) => {
        update('RemoveImageMetadata', value);
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
                        onChange={(value) => handleChangeDraftType(value)}
                        loading={isLoading('DraftMIMEType')}
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
                        onChange={(value) => handleChangeRightToLeft(value)}
                        loading={isLoading('RightToLeft')}
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
                                onChange={(value) => handleChangeFontFace(value)}
                                loading={isLoading('FontFace')}
                            />
                        </div>
                        <div className="shrink-0">
                            <FontSizeSelect
                                id="fontSize"
                                aria-labelledby="label-composer-default-font-size"
                                fontSize={FontSize || DEFAULT_FONT_SIZE}
                                onChange={(value) => handleChangeFontSize(value)}
                                loading={isLoading('FontSize')}
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
                        loading={isLoading('RemoveImageMetadata')}
                        onChange={(newValue) => handleRemoveImageMetadata(newValue)}
                    />
                }
            />
        </SettingsCardRows>
    );
};

export default MessagesOtherSection;
