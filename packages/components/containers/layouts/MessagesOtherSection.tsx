import { c } from 'ttag';

import { getFontFaceIdFromValue, getFontFaceValueFromId } from '@proton/components/components/editor/helpers/fontFace';
import Info from '@proton/components/components/link/Info';
import { useLoading } from '@proton/hooks';
import {
    updateDraftType,
    updateFontFace,
    updateFontSize,
    updateRightToLeft,
} from '@proton/shared/lib/api/mailSettings';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import type { DIRECTION } from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { Label } from '../../components';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '../../components/editor/constants';
import { useApi, useEventManager, useMailSettings, useNotifications } from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import DelaySendSecondsSelect from '../messages/DelaySendSecondsSelect';
import DraftTypeSelect from './DraftTypeSelect';
import FontFaceSelect from './FontFaceSelect';
import FontSizeSelect from './FontSizeSelect';
import TextDirectionSelect from './TextDirectionSelect';

const MessagesOtherSection = () => {
    const api = useApi();
    const [{ DraftMIMEType, RightToLeft, FontFace, FontSize, DelaySendSeconds } = DEFAULT_MAILSETTINGS] =
        useMailSettings();
    const fontFaceValue = getFontFaceValueFromId(FontFace) || DEFAULT_FONT_FACE;
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const [loadingDraftType, withLoadingDraftType] = useLoading();
    const [loadingRightToLeft, withLoadingRightToLeft] = useLoading();
    const [loadingFontFace, withLoadingFontFace] = useLoading();
    const [loadingFontSize, withLoadingFontSize] = useLoading();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleChangeDraftType = async (value: MIME_TYPES) => {
        await api(updateDraftType(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeRightToLeft = async (value: DIRECTION) => {
        await api(updateRightToLeft(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeFontFace = async (value: string) => {
        const fontFaceId = getFontFaceIdFromValue(value);
        if (fontFaceId) {
            await api(updateFontFace(fontFaceId));
            await call();
            notifyPreferenceSaved();
        }
    };

    const handleChangeFontSize = async (value: number) => {
        await api(updateFontSize(value));
        await call();
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
        </>
    );
};

export default MessagesOtherSection;
