import { c } from 'ttag';
import {
    updateViewMode,
    updateStickyLabels,
    updateDraftType,
    updateRightToLeft,
    updateFontFace,
    updateFontSize,
} from '@proton/shared/lib/api/mailSettings';
import { VIEW_MODE, MIME_TYPES, RIGHT_TO_LEFT, STICKY_LABELS } from '@proton/shared/lib/constants';

import { Label, Info } from '../../components';
import { useEventManager, useMailSettings, useNotifications, useApi, useLoading } from '../../hooks';
import DraftTypeSelect from './DraftTypeSelect';
import TextDirectionSelect from './TextDirectionSelect';
import ViewModeToggle from './ViewModeToggle';
import StickyLabelsToggle from './StickyLabelsToggle';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import FontFaceSelect from './FontFaceSelect';
import FontSizeSelect from './FontSizeSelect';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '../../components/editor/constants';

const AppearanceOtherSection = () => {
    const api = useApi();
    const [
        {
            ViewMode = 0,
            StickyLabels = 0,
            DraftMIMEType = MIME_TYPES.DEFAULT,
            RightToLeft = 0,
            FontFace = DEFAULT_FONT_FACE,
            FontSize = DEFAULT_FONT_SIZE,
        } = {},
    ] = useMailSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    const [loadingViewMode, withLoadingViewMode] = useLoading();
    const [loadingStickyLabels, withLoadingStickyLabels] = useLoading();
    const [loadingDraftType, withLoadingDraftType] = useLoading();
    const [loadingRightToLeft, withLoadingRightToLeft] = useLoading();
    const [loadingFontFace, withLoadingFontFace] = useLoading();
    const [loadingFontSize, withLoadingFontSize] = useLoading();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleToggleStickyLabels = async (value: number) => {
        await api(updateStickyLabels(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeDraftType = async (value: MIME_TYPES) => {
        await api(updateDraftType(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeViewMode = async (mode: VIEW_MODE) => {
        if (mode === VIEW_MODE.SINGLE) {
            await api(updateStickyLabels(STICKY_LABELS.OFF));
        }
        await api(updateViewMode(mode));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeRightToLeft = async (value: RIGHT_TO_LEFT) => {
        await api(updateRightToLeft(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeFontFace = async (value: string) => {
        await api(updateFontFace(value));
        await call();
        notifyPreferenceSaved();
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
                    <label htmlFor="viewMode" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Conversation grouping`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Group emails in the same conversation together in your Inbox or display them separately.`}
                        />
                    </label>
                </SettingsLayoutLeft>

                <SettingsLayoutRight className="pt0-5">
                    <ViewModeToggle
                        id="viewMode"
                        viewMode={ViewMode}
                        loading={loadingViewMode}
                        onToggle={(value) => withLoadingViewMode(handleChangeViewMode(value))}
                        data-testid="appearance:conversation-group-toggle"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="stickyLabelsToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Use sticky labels`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When you add a label to a message in a conversation, it will automatically be applied to all future messages you send or receive in that conversation.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <StickyLabelsToggle
                        id="stickyLabelsToggle"
                        stickyLabels={StickyLabels}
                        loading={loadingStickyLabels}
                        onToggle={(value) => withLoadingStickyLabels(handleToggleStickyLabels(value))}
                        data-testid="appearance:sticky-labels-toggle"
                        disabled={ViewMode !== VIEW_MODE.GROUP}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

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
                    <label htmlFor="fontFace" className="text-semibold">
                        {c('Label').t`Composer default font/size`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-row flex-justify-space-between">
                    <div>
                        <FontFaceSelect
                            id="fontFace"
                            fontFace={FontFace || DEFAULT_FONT_FACE}
                            onChange={(value) => withLoadingFontFace(handleChangeFontFace(value))}
                            loading={loadingFontFace}
                        />
                    </div>
                    <div>
                        <FontSizeSelect
                            id="fontSize"
                            fontSize={FontSize || DEFAULT_FONT_SIZE}
                            onChange={(value) => withLoadingFontSize(handleChangeFontSize(value))}
                            loading={loadingFontSize}
                        />
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
        </>
    );
};

export default AppearanceOtherSection;
