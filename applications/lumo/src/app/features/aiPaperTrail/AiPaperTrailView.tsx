import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { getMessageContent } from '../../messageHelpers';
import { useLumoDispatch, useLumoMemoSelector, useLumoSelector } from '../../redux/hooks';
import { selectConversationById, selectMessagesByConversationId } from '../../redux/selectors';
import { setGhostChatMode } from '../../redux/slices/ghostChat';
import { ConversationStatus, type Message, Role } from '../../types';
import { isPaperTrailLocalSaveEnabled, setPaperTrailLocalSaveEnabled } from '../../util/paperTrailLocalSavePreference';
import { removeRecentPaperTrailFile } from '../../util/paperTrailRecentStorage';
import { getPaperTrailReport, savePaperTrailReport } from '../../util/paperTrailReportStorage';
import { PaperTrailHeader } from './PaperTrailHeader';
import { PaperTrailLightThemeScope } from './PaperTrailLightThemeScope';
import { PaperTrailLowProfileView } from './PaperTrailLowProfileView';
import { PaperTrailReportView } from './PaperTrailReportView';
import { LandingStage } from './landing/LandingStage';
import { LoadingStage } from './loading/LoadingStage';
import { parsePaperTrailAnalysis } from './parsePaperTrailReport';
import type { PaperTrailReport } from './reportTypes';
import { useStartPaperTrail } from './useStartPaperTrail';
import { InstructionsStage } from './wizard/InstructionsStage';
import { UploadStage } from './wizard/UploadStage';

import './AiPaperTrailView.scss';

type WizardStep = 'landing' | 'instructions' | 'upload';

export const AiPaperTrailView = () => {
    const { status, error, conversationId, importId, start, reset } = useStartPaperTrail();
    const navigate = useLumoNavigate();
    const dispatch = useLumoDispatch();
    const [wizardStep, setWizardStep] = useState<WizardStep>('landing');
    const [saveLocallyEnabled, setSaveLocallyEnabled] = useState(isPaperTrailLocalSaveEnabled);
    const [savedReport, setSavedReport] = useState<PaperTrailReport | undefined>();
    const [savedReportId, setSavedReportId] = useState<string>();
    const [recentFilesRefreshKey, setRecentFilesRefreshKey] = useState(0);

    const handleSaveLocallyChange = useCallback((enabled: boolean) => {
        setPaperTrailLocalSaveEnabled(enabled);
        setSaveLocallyEnabled(enabled);
        setRecentFilesRefreshKey((value) => {
            return value + 1;
        });
        if (!enabled) {
            setSavedReport(undefined);
            setSavedReportId(undefined);
        }
    }, []);

    const handleGenerateReport = useCallback(
        (file: File) => {
            void start(file);
        },
        [start]
    );

    const handleStartChat = useCallback(() => {
        dispatch(setGhostChatMode(false));
        navigate('/');
    }, [dispatch, navigate]);

    const messagesMap = useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);
    const conversation = useLumoSelector(selectConversationById(conversationId ?? ''));

    const assistantMessage = useMemo(() => {
        return Object.values(messagesMap).find((message: Message) => {
            return message.role === Role.Assistant;
        });
    }, [messagesMap]);

    const isFinished =
        !!conversationId &&
        ((!!conversation && conversation.status !== ConversationStatus.GENERATING) ||
            assistantMessage?.status !== undefined);

    const analysis = useMemo(() => {
        if (!isFinished || !assistantMessage) {
            return undefined;
        }

        return parsePaperTrailAnalysis(getMessageContent(assistantMessage));
    }, [isFinished, assistantMessage]);

    useEffect(() => {
        if (isFinished && analysis?.kind === 'report' && importId) {
            savePaperTrailReport(importId, analysis.report);
            setRecentFilesRefreshKey((value) => {
                return value + 1;
            });
        }
    }, [isFinished, analysis, importId]);

    const handleOpenSavedReport = useCallback((id: string) => {
        const storedReport = getPaperTrailReport(id);
        if (storedReport) {
            setSavedReportId(id);
            setSavedReport(storedReport);
        }
    }, []);

    const handleDeleteReport = useCallback(
        (id: string) => {
            removeRecentPaperTrailFile(id);
            setRecentFilesRefreshKey((value) => {
                return value + 1;
            });
            if (savedReportId === id) {
                setSavedReport(undefined);
                setSavedReportId(undefined);
            }
        },
        [savedReportId]
    );

    const handleStartOver = useCallback(() => {
        setSavedReport(undefined);
        setSavedReportId(undefined);
        setWizardStep('landing');
        reset();
    }, [reset]);

    useEffect(() => {
        if (status === 'error' && !conversationId) {
            setWizardStep('upload');
        }
    }, [status, conversationId]);

    let content: JSX.Element;
    if (savedReport) {
        content = (
            <PaperTrailReportView report={savedReport} onStartOver={handleStartOver} onTryLumo={handleStartChat} />
        );
    } else if (status === 'idle' || (status === 'error' && !conversationId)) {
        if (wizardStep === 'landing') {
            content = (
                <LandingStage
                    onGenerate={() => {
                        setWizardStep('instructions');
                    }}
                    recentFilesRefreshKey={recentFilesRefreshKey}
                    onOpenReport={handleOpenSavedReport}
                    onDeleteReport={handleDeleteReport}
                />
            );
        } else if (wizardStep === 'instructions') {
            content = (
                <InstructionsStage
                    onBack={() => {
                        setWizardStep('landing');
                    }}
                    onContinue={() => {
                        setWizardStep('upload');
                    }}
                />
            );
        } else {
            content = (
                <UploadStage
                    error={error}
                    saveLocallyEnabled={saveLocallyEnabled}
                    onSaveLocallyChange={handleSaveLocallyChange}
                    onBack={() => {
                        setWizardStep('instructions');
                    }}
                    onGenerate={handleGenerateReport}
                />
            );
        }
    } else if (!isFinished) {
        content = <LoadingStage />;
    } else if (analysis?.kind === 'report') {
        content = (
            <PaperTrailReportView report={analysis.report} onStartOver={handleStartOver} onTryLumo={handleStartChat} />
        );
    } else if (analysis?.kind === 'insufficient_data') {
        content = <PaperTrailLowProfileView onStartOver={handleStartOver} />;
    } else {
        content = (
            <div className="ai-paper-trail__inner flex flex-column items-center gap-4 text-center">
                <LumoIcon name="CircleAlert" size={32} className="color-danger" />
                <h2 className="ai-paper-trail__title m-0">
                    {c('collider_2025:Title').t`We couldn't read your paper trail`}
                </h2>
                <p className="ai-paper-trail__subtitle m-0">
                    {c('collider_2025:Info').t`Something went wrong analysing this export. Please try again.`}
                </p>
                <Button color="norm" pill onClick={handleStartOver}>
                    {c('collider_2025:Action').t`Try again`}
                </Button>
            </div>
        );
    }

    return (
        <PaperTrailLightThemeScope>
            <div className="ai-paper-trail">
                <PaperTrailHeader onStartChat={handleStartChat} />
                {content}
            </div>
        </PaperTrailLightThemeScope>
    );
};

export default AiPaperTrailView;
