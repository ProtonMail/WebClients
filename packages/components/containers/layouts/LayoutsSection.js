import React from 'react';
import { c } from 'ttag';
import {
    updateComposerMode,
    updateViewMode,
    updateViewLayout,
    updateStickyLabels,
    updateDraftType,
    updateRightToLeft,
} from 'proton-shared/lib/api/mailSettings';
import { updateDensity } from 'proton-shared/lib/api/settings';
import { VIEW_MODE, STICKY_LABELS } from 'proton-shared/lib/constants';

import { Alert, Row, Field, Label, Info, Loader } from '../../components';
import { useNotifications, useUserSettings, useMailSettings, useEventManager, useLoading, useApi } from '../../hooks';
import DraftTypeSelect from './DraftTypeSelect';
import TextDirectionSelect from './TextDirectionSelect';
import ComposerModeRadios from './ComposerModeRadios';
import ViewLayoutRadios from './ViewLayoutRadios';
import ViewModeRadios from './ViewModeRadios';
import DensityRadios from './DensityRadios';
import StickyLabelsToggle from './StickyLabelsToggle';

const { GROUP } = VIEW_MODE;

const LayoutsSection = () => {
    const [
        { ComposerMode, ViewMode, ViewLayout, StickyLabels, DraftMIMEType, RightToLeft } = {},
        loadingMailSettings,
    ] = useMailSettings();
    const [{ Density }, loadingUserSettings] = useUserSettings();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loadingComposerMode, withLoadingComposerMode] = useLoading();
    const [loadingViewMode, withLoadingViewMode] = useLoading();
    const [loadingViewLayout, withLoadingViewLayout] = useLoading();
    const [loadingDensity, withLoadingDensity] = useLoading();
    const [loadingStickyLabels, withLoadingStickyLabels] = useLoading();
    const [loadingDraftType, withLoadingDraftType] = useLoading();
    const [loadingRightToLeft, withLoadingRightToLeft] = useLoading();

    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleChangeComposerMode = async (mode) => {
        await api(updateComposerMode(mode));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeViewMode = async (mode) => {
        if (mode === VIEW_MODE.SINGLE) {
            await api(updateStickyLabels(STICKY_LABELS.OFF));
        }
        await api(updateViewMode(mode));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeViewLayout = async (mode) => {
        await api(updateViewLayout(mode));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeDensity = async (density) => {
        await api(updateDensity(density));
        await call();
        notifyPreferenceSaved();
    };

    const handleToggleStickyLabels = async (value) => {
        await api(updateStickyLabels(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeDraftType = async (value) => {
        await api(updateDraftType(value));
        await call();
        notifyPreferenceSaved();
    };

    const handleChangeRightToLeft = async (value) => {
        await api(updateRightToLeft(value));
        await call();
        notifyPreferenceSaved();
    };

    if (loadingMailSettings || loadingUserSettings) {
        return <Loader />;
    }

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/change-inbox-layout/">{c('Info')
                .t`Choose the look and feel of your mailbox.`}</Alert>
            <Row>
                <Label htmlFor="composerMode">
                    <span className="mr0-5">{c('Label').t`Default composer`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/composer/"
                        title={c('Tooltip')
                            .t`This sets the default composer size. Two sizes are available, a smaller popup composer, and a bigger full screen composer.`}
                    />
                </Label>
                <ComposerModeRadios
                    id="composerMode"
                    composerMode={ComposerMode}
                    onChange={(value) => withLoadingComposerMode(handleChangeComposerMode(value))}
                    loading={loadingComposerMode}
                />
            </Row>
            <Row>
                <Label htmlFor="layoutMode">
                    <span className="mr0-5">{c('Label').t`Default inbox`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/change-inbox-layout/"
                        title={c('Tooltip')
                            .t`ProtonMail supports both column and row layouts for the inbox. Using this setting, it is possible to change between the two layouts.`}
                    />
                </Label>
                <ViewLayoutRadios
                    id="layoutMode"
                    viewLayout={ViewLayout}
                    onChange={(value) => withLoadingViewLayout(handleChangeViewLayout(value))}
                    loading={loadingViewLayout}
                />
            </Row>
            <Row>
                <Label htmlFor="viewMode">
                    <span className="mr0-5">{c('Label').t`Conversations`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Conversation grouping automatically groups messages in the same conversation together.`}
                    />
                </Label>
                <ViewModeRadios
                    viewMode={ViewMode}
                    onChange={(value) => withLoadingViewMode(handleChangeViewMode(value))}
                    loading={loadingViewMode}
                    id="viewMode"
                />
            </Row>
            <Row>
                <Label htmlFor="density">{c('Label').t`Density`}</Label>
                <DensityRadios
                    density={Density}
                    onChange={(value) => withLoadingDensity(handleChangeDensity(value))}
                    loading={loadingDensity}
                    id="density"
                />
            </Row>
            {ViewMode === GROUP ? (
                <Row>
                    <Label htmlFor="stickyLabelsToggle">
                        <span className="mr0-5">{c('Label').t`Use sticky labels`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`When a label is added to a message in a conversation, all future messages you send or receive will have that same label automatically applied.`}
                        />
                    </Label>
                    <Field className="pt0-5">
                        <StickyLabelsToggle
                            id="stickyLabelsToggle"
                            stickyLabels={StickyLabels}
                            loading={loadingStickyLabels}
                            onToggle={(value) => withLoadingStickyLabels(handleToggleStickyLabels(value))}
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
                        onChange={(value) => withLoadingDraftType(handleChangeDraftType(value))}
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
                        onChange={(value) => withLoadingRightToLeft(handleChangeRightToLeft(value))}
                        loading={loadingRightToLeft}
                    />
                </Field>
            </Row>
        </>
    );
};

export default LayoutsSection;
