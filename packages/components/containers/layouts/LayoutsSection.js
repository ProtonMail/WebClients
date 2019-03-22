import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Alert,
    Row,
    Label,
    Info,
    useMailSettings,
    useEventManager,
    useApiWithoutResult
} from 'react-components';
import {
    updateComposerMode,
    updateViewMode,
    updateViewLayout,
    updateDraftType,
    updateRightToLeft,
    updateShowMoved
} from 'proton-shared/lib/api/mailSettings';

import DraftTypeSelect from './DraftTypeSelect';
import TextDirectionSelect from './TextDirectionSelect';
import ShowMovedSelect from './ShowMovedSelect';
import ComposerModeRadios from './ComposerModeRadios';
import ViewLayoutRadios from './ViewLayoutRadios';
import ViewModeRadios from './ViewModeRadios';

const LayoutsSection = () => {
    const [{ ComposerMode, ViewMode, ViewLayout, DraftMIMEType, RightToLeft, ShowMoved }] = useMailSettings();
    const { call } = useEventManager();
    const { request: requestComposerMode, loading: loadingComposerMode } = useApiWithoutResult(updateComposerMode);
    const { request: requestViewMode, loading: loadingViewMode } = useApiWithoutResult(updateViewMode);
    const { request: requestViewLayout, loading: loadingViewLayout } = useApiWithoutResult(updateViewLayout);
    const { request: requestDraftType, loading: loadingDraftType } = useApiWithoutResult(updateDraftType);
    const { request: requestRightToLeft, loading: loadingRightToLeft } = useApiWithoutResult(updateRightToLeft);
    const { request: requestShowMoved, loading: loadingShowMoved } = useApiWithoutResult(updateShowMoved);
    const handleChangeComposerMode = (mode) => async () => {
        await requestComposerMode(mode);
        call();
    };
    const handleChangeViewMode = (mode) => async () => {
        await requestViewMode(mode);
        call();
    };
    const handleChangeViewLayout = (mode) => async () => {
        await requestViewLayout(mode);
        call();
    };
    const handleChangeDraftType = ({ target }) => async () => {
        await requestDraftType(target.value);
        call();
    };
    const handleChangeRightToLeft = ({ target }) => async () => {
        await requestRightToLeft(target.value);
        call();
    };
    const handleChangeShowMoved = ({ target }) => async () => {
        await requestShowMoved(target.value);
        call();
    };

    return (
        <>
            <SubTitle>{c('Title').t`Layouts`}</SubTitle>
            <Alert>{c('Info').t`Lorem ipsum`}</Alert>
            <Row>
                <Label>
                    <span className="mr1">{c('Label').t`Default Composer`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/composer/"
                        title={c('Tooltip')
                            .t`This sets the default composer size. Two sizes are available, a smaller popup composer, and a bigger full screen composer.`}
                    />
                </Label>
                <ComposerModeRadios
                    composerMode={ComposerMode}
                    handleChange={handleChangeComposerMode}
                    loading={loadingComposerMode}
                />
            </Row>
            <Row>
                <Label>
                    <span className="mr1">{c('Label').t`Default Inbox`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/change-inbox-layout/"
                        title={c('Tooltip')
                            .t`ProtonMail supports both column and row layouts for the inbox. Using this setting, it is possible to change between the two layouts.`}
                    />
                </Label>
                <ViewLayoutRadios viewMode={ViewMode} handleChange={handleChangeViewMode} loading={loadingViewMode} />
            </Row>
            <Row>
                <Label>
                    <span className="mr1">{c('Label').t`Conversations`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Conversation Grouping automatically groups messages in the same conversation together.`}
                    />
                </Label>
                <ViewModeRadios
                    viewLayout={ViewLayout}
                    handleChange={handleChangeViewLayout}
                    loading={loadingViewLayout}
                />
            </Row>
            <Row>
                <Label>{c('Label').t`Composer Mode`}</Label>
                <DraftTypeSelect
                    draftType={DraftMIMEType}
                    handleChange={handleChangeDraftType}
                    loading={loadingDraftType}
                />
            </Row>
            <Row>
                <Label>{c('Label').t`Composer Text Direction`}</Label>
                <TextDirectionSelect
                    rightToLeft={RightToLeft}
                    handleChange={handleChangeRightToLeft}
                    loading={loadingRightToLeft}
                />
            </Row>
            <Row>
                <Label>
                    <span className="mr1">{c('Label').t`Sent/Drafts`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Setting to 'Include Moved' means that sent / drafts messages that have been moved to other folders will continue to appear in the Sent/Drafts folder.`}
                    />
                </Label>
                <ShowMovedSelect
                    showMoved={ShowMoved}
                    handleChange={handleChangeShowMoved}
                    loading={loadingShowMoved}
                />
            </Row>
        </>
    );
};

export default LayoutsSection;
