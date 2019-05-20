import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Alert,
    Row,
    Field,
    Label,
    Info,
    useNotifications,
    useMailSettings,
    useEventManager,
    useApiWithoutResult
} from 'react-components';
import {
    updateComposerMode,
    updateViewMode,
    updateViewLayout,
    updateStickyLabels,
    updateDraftType,
    updateRightToLeft
} from 'proton-shared/lib/api/mailSettings';
import { VIEW_MODE } from 'proton-shared/lib/constants';

import DraftTypeSelect from './DraftTypeSelect';
import TextDirectionSelect from './TextDirectionSelect';
import ComposerModeRadios from './ComposerModeRadios';
import ViewLayoutRadios from './ViewLayoutRadios';
import ViewModeRadios from './ViewModeRadios';
import StickyLabelsToggle from './StickyLabelsToggle';

const { GROUP } = VIEW_MODE;

const LayoutsSection = () => {
    const [{ ComposerMode, ViewMode, ViewLayout, StickyLabels, DraftMIMEType, RightToLeft } = {}] = useMailSettings();
    const { call } = useEventManager();

    const { createNotification } = useNotifications();
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const { request: requestComposerMode, loading: loadingComposerMode } = useApiWithoutResult(updateComposerMode);
    const { request: requestViewMode, loading: loadingViewMode } = useApiWithoutResult(updateViewMode);
    const { request: requestViewLayout, loading: loadingViewLayout } = useApiWithoutResult(updateViewLayout);
    const { request: requestStickyLabels, loading: loadingStickyLabels } = useApiWithoutResult(updateStickyLabels);
    const { request: requestDraftType, loading: loadingDraftType } = useApiWithoutResult(updateDraftType);
    const { request: requestRightToLeft, loading: loadingRightToLeft } = useApiWithoutResult(updateRightToLeft);

    const handleChangeComposerMode = async (mode) => {
        await requestComposerMode(mode);
        call();
        notifyPreferenceSaved();
    };

    const handleChangeViewMode = async (mode) => {
        await requestViewMode(mode);
        call();
        notifyPreferenceSaved();
    };

    const handleChangeViewLayout = async (mode) => {
        await requestViewLayout(mode);
        call();
        notifyPreferenceSaved();
    };

    const handleToggleStickyLabels = async (value) => {
        await requestStickyLabels(value);
        call();
        notifyPreferenceSaved();
    };

    const handleChangeDraftType = async (value) => {
        await requestDraftType(value);
        call();
        notifyPreferenceSaved();
    };

    const handleChangeRightToLeft = async (value) => {
        await requestRightToLeft(value);
        call();
        notifyPreferenceSaved();
    };

    return (
        <>
            <SubTitle>{c('Title').t`Layouts`}</SubTitle>
            <Alert>{c('Info').t`Lorem ipsum`}</Alert>
            <Row>
                <Label htmlFor="composerMode">
                    <span className="mr1">{c('Label').t`Default Composer`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/composer/"
                        title={c('Tooltip')
                            .t`This sets the default composer size. Two sizes are available, a smaller popup composer, and a bigger full screen composer.`}
                    />
                </Label>
                <ComposerModeRadios
                    id="composerMode"
                    composerMode={ComposerMode}
                    onChange={handleChangeComposerMode}
                    loading={loadingComposerMode}
                />
            </Row>
            <Row>
                <Label htmlFor="layoutMode">
                    <span className="mr1">{c('Label').t`Default Inbox`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/change-inbox-layout/"
                        title={c('Tooltip')
                            .t`ProtonMail supports both column and row layouts for the inbox. Using this setting, it is possible to change between the two layouts.`}
                    />
                </Label>
                <ViewLayoutRadios
                    id="layoutMode"
                    viewLayout={ViewLayout}
                    onChange={handleChangeViewLayout}
                    loading={loadingViewLayout}
                />
            </Row>
            <Row>
                <Label htmlFor="viewMode">
                    <span className="mr1">{c('Label').t`Conversations`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Conversation grouping automatically groups messages in the same conversation together.`}
                    />
                </Label>
                <ViewModeRadios
                    viewMode={ViewMode}
                    onChange={handleChangeViewMode}
                    loading={loadingViewMode}
                    id="viewMode"
                />
            </Row>
            {ViewMode === GROUP ? (
                <Row>
                    <Label htmlFor={'stickyLabelsToggle'}>
                        <span className="mr1">{c('Label').t`Use sticky labels`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When a label is added to a message in a conversation, all future messages you send or receive will have that same label automatically applied.`}
                        />
                    </Label>
                    <Field>
                        <StickyLabelsToggle
                            id="stickyLabelsToggle"
                            stickyLabels={StickyLabels}
                            loading={loadingStickyLabels}
                            onToggle={handleToggleStickyLabels}
                        />
                    </Field>
                </Row>
            ) : null}
            <Row>
                <Label htmlFor="draftType">{c('Label').t`Composer mode`}</Label>
                <Field>
                    <DraftTypeSelect
                        id="draftTypeSelect"
                        draftType={DraftMIMEType}
                        onChange={handleChangeDraftType}
                        loading={loadingDraftType}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="textDirection">{c('Label').t`Composer text direction`}</Label>
                <Field>
                    <TextDirectionSelect
                        id="textDirection"
                        rightToLeft={RightToLeft}
                        onChange={handleChangeRightToLeft}
                        loading={loadingRightToLeft}
                    />
                </Field>
            </Row>
        </>
    );
};

export default LayoutsSection;
