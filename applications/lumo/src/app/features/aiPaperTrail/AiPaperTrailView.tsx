import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import {
    BRAND_NAME,
    DRIVE_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import lumoLogoWordmark from '@proton/styles/assets/img/lumo/lumo-logo-wordmark.svg';
import ctaContainerBg from '@proton/styles/assets/img/lumo/trail/cta-container-bg.png';
import claudeLogo from '@proton/styles/assets/img/lumo/trail/claude.svg';
import chatgptLogo from '@proton/styles/assets/img/lumo/trail/chatgpt.svg';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { useLumoDispatch, useLumoMemoSelector, useLumoSelector } from '../../redux/hooks';
import { selectConversationById, selectMessagesByConversationId } from '../../redux/selectors';
import { setGhostChatMode } from '../../redux/slices/ghostChat';
import { ConversationStatus, type Message, Role } from '../../types';
import { getRecentPaperTrailFiles, type RecentPaperTrailFile } from '../../util/paperTrailRecentStorage';
import { PAPER_TRAIL_LIMITS } from './buildPaperTrailContext';
import { PaperTrailHeader } from './PaperTrailHeader';
import { PaperTrailLumoLogoAnimation } from './PaperTrailLumoLogoAnimation';
import { PaperTrailReportView } from './PaperTrailReportView';
import { parsePaperTrailReport } from './parsePaperTrailReport';
import { useStartPaperTrail } from './useStartPaperTrail';

import './AiPaperTrailView.scss';

const ACCEPTED = '.json,.zip,application/json,application/zip';

const formatRecentDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const ExportGuideCard = ({
    logo,
    title,
    steps,
    note,
}: {
    logo: string;
    title: string;
    steps: string[];
    note: string;
}) => (
    <div className="ai-paper-trail__export-card">
        <div className="ai-paper-trail__export-card-head">
            <img src={logo} alt="" className="ai-paper-trail__export-logo" />
            <h3 className="ai-paper-trail__export-title">{title}</h3>
        </div>
        <ol className="ai-paper-trail__export-steps">
            {steps.map((step, index) => (
                <li key={index} className="ai-paper-trail__export-step">
                    <span className="ai-paper-trail__export-step-num">{index + 1}</span>
                    <span>{step}</span>
                </li>
            ))}
        </ol>
        <p className="ai-paper-trail__export-note">{note}</p>
    </div>
);

const RecentFilesSection = ({ files }: { files: RecentPaperTrailFile[] }) => {
    if (files.length === 0) {
        return null;
    }

    return (
        <section className="ai-paper-trail__recent">
            <div className="ai-paper-trail__recent-head">
                <h2 className="ai-paper-trail__recent-title">{c('collider_2025:Title').t`Your recent files`}</h2>
                <span className="ai-paper-trail__recent-label">{c('collider_2025:Label').t`Date`}</span>
            </div>
            <ul className="ai-paper-trail__recent-list">
                {files.map((file) => (
                    <li key={`${file.filename}-${file.uploadedAt}`} className="ai-paper-trail__recent-item">
                        <LumoIcon name="FileText" size={16} className="ai-paper-trail__recent-icon shrink-0" />
                        <span className="ai-paper-trail__recent-name">{file.filename}</span>
                        <span className="ai-paper-trail__recent-date">{formatRecentDate(file.uploadedAt)}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

const UploadStage = ({
    onFile,
    error,
    onStartChat,
}: {
    onFile: (file: File | undefined) => void;
    error?: string;
    onStartChat: () => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [recentFiles, setRecentFiles] = useState<RecentPaperTrailFile[]>([]);

    useEffect(() => {
        setRecentFiles(getRecentPaperTrailFiles());
    }, []);

    const steps = [
        {
            title: c('collider_2025:Title').t`Export your data`,
            detail: c('collider_2025:Info')
                .t`Log in to your AI platform and request an export of your chat history, then download it to your device.`,
        },
        {
            title: c('collider_2025:Title').t`Upload it securely`,
            detail: c('collider_2025:Info')
                .t`We extract your ${PAPER_TRAIL_LIMITS.maxPrompts} most recent prompts to keep processing fast. Nothing is uploaded to our servers or stored.`,
        },
        {
            title: c('collider_2025:Title').t`Get your AI Paper Trail`,
            detail: c('collider_2025:Info')
                .t`See the profile an AI company can piece together from your conversations alone.`,
        },
    ];

    const chatGptSteps = [
        c('collider_2025:Info').t`Sign in to your ChatGPT account at chatgpt.com`,
        c('collider_2025:Info').t`Click your profile icon in the bottom-left corner`,
        c('collider_2025:Info').t`Click Settings → Data controls`,
        c('collider_2025:Info').t`Look for Export data`,
        c('collider_2025:Info').t`Follow the prompts and confirm the export`,
    ];

    const claudeSteps = [
        c('collider_2025:Info').t`Sign in to your Claude account at claude.ai`,
        c('collider_2025:Info').t`Click your profile icon in the bottom-left corner`,
        c('collider_2025:Info').t`Click Settings → Privacy`,
        c('collider_2025:Info').t`Under your data, click Export data`,
        c('collider_2025:Info').t`Follow the prompts to confirm the export`,
    ];

    return (
        <div className="ai-paper-trail__inner ai-paper-trail__landing">
            <div className="ai-paper-trail__hero">
                <PaperTrailLumoLogoAnimation />
                <span className="ai-paper-trail__subtitle text-bold pb-2">{c('collider_2025:Title').t`Generate your AI paper trail`}</span>
                <h1 className="ai-paper-trail__title">
                    {c('collider_2025:Title').t`See what Big Tech AI already knows about you`}
                </h1>
                <p className="ai-paper-trail__subtitle">
                    {c('collider_2025:Info')
                        .t`Every conversation with AI leaves a paper trail. Your job. Your health. Your relationships. Even where you live. Upload your AI data and see what Big Tech could piece together from your words alone. But unlike them, we can't see it.`}
                </p>
            </div>

            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <div
                className={clsx('ai-paper-trail__dropzone', isDragging && 'is-dragging')}
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    onFile(e.dataTransfer.files?.[0]);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    className="sr-only"
                    onChange={(e) => {
                        onFile(e.target.files?.[0]);
                        e.target.value = '';
                    }}
                />
                <div className="flex flex-column items-center gap-3 text-center">
                    <LumoIcon name="FileUp" size={32} className="ai-paper-trail__upload-icon" />
                    <span className="text-lg text-semibold">{c('collider_2025:Action').t`Upload your AI export`}</span>
                    <span className="ai-paper-trail__muted text-sm">
                        {c('collider_2025:Info')
                            .t`Choose or drop your ChatGPT or Claude export (.zip or conversations.json). We analyze your ${PAPER_TRAIL_LIMITS.maxPrompts} most recent prompts.`}
                    </span>
                </div>
            </div>

            {error && (
                <div className="ai-paper-trail__error flex flex-row flex-nowrap items-start gap-2 mt-4 p-3 rounded">
                    <LumoIcon name="CircleAlert" size={16} className="color-danger shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="ai-paper-trail__privacy flex flex-row flex-nowrap items-center gap-2 mt-4">
                <LumoIcon name="Lock" size={16} className="shrink-0" />
                <span className="text-sm">
                    {c('collider_2025:Info')
                        .t`Your export is encrypted on your device. Not even ${LUMO_SHORT_APP_NAME} can read it.`}
                </span>
            </div>

            <RecentFilesSection files={recentFiles} />

            <div className="ai-paper-trail__steps">
                {steps.map((step, i) => (
                    <div key={i} className="ai-paper-trail__step">
                        <span className="ai-paper-trail__step-num">{i + 1}</span>
                        <span className="ai-paper-trail__step-title">{step.title}</span>
                        <span className="ai-paper-trail__step-detail">{step.detail}</span>
                    </div>
                ))}
            </div>

            <section className="ai-paper-trail__export-section">
                <h2 className="ai-paper-trail__export-heading">{c('collider_2025:Title').t`How to export your data`}</h2>
                <div className="ai-paper-trail__export-grid">
                    <ExportGuideCard
                        logo={chatgptLogo}
                        title="ChatGPT"
                        steps={chatGptSteps}
                        note={c('collider_2025:Info')
                            .t`OpenAI will email you a download link. It can take up to 24 hours.`}
                    />
                    <ExportGuideCard
                        logo={claudeLogo}
                        title="Claude"
                        steps={claudeSteps}
                        note={c('collider_2025:Info')
                            .t`Anthropic will email you a download link when your export is ready.`}
                    />
                </div>
            </section>

            <div className="ai-paper-trail__cta-banner" style={{ backgroundImage: `url(${ctaContainerBg})` }}>
                <img src={lumoLogoWordmark} alt={LUMO_SHORT_APP_NAME} className="ai-paper-trail__cta-wordmark" />
                <p className="ai-paper-trail__cta-title">
                    {c('collider_2025:Title')
                        .t`Your conversations should belong to you. With ${LUMO_SHORT_APP_NAME}, they do.`}
                </p>
                <Button color="norm" size="large" pill onClick={onStartChat}>
                    {c('collider_2025:Action').t`Try ${LUMO_SHORT_APP_NAME} for free`}
                </Button>
            </div>

            <p className="ai-paper-trail__footer">
                {c('collider_2025:Info')
                    .t`Built by ${BRAND_NAME}, the privacy brand trusted by over 100M people and the team behind ${MAIL_APP_NAME}, ${VPN_APP_NAME}, ${DRIVE_APP_NAME}, and ${PASS_APP_NAME}.`}
            </p>
        </div>
    );
};

const LoadingStage = () => {
    const messages = [
        c('collider_2025:Info').t`Reading your prompts…`,
        c('collider_2025:Info').t`Spotting the patterns in what you typed…`,
        c('collider_2025:Info').t`Working out what Big Tech AI could infer…`,
        c('collider_2025:Info').t`Scoring how much you revealed…`,
        c('collider_2025:Info').t`Assembling your profile…`,
    ];

    const lessons = [
        {
            emoji: '💬',
            tag: c('collider_2025:Label').t`How AI gets more out of you`,
            title: c('collider_2025:Title').t`Every clarification is a new data point`,
            body: c('collider_2025:Info')
                .t`Conversational AI doesn't just answer — it asks follow-up questions. Each time you add detail ("actually, I'm 34 and based in Berlin"), you hand over another verified fact.`,
        },
        {
            emoji: '🗳️',
            tag: c('collider_2025:Label').t`Politics`,
            title: c('collider_2025:Title').t`Your views can be used to nudge you`,
            body: c('collider_2025:Info')
                .t`Inferred political leanings power micro-targeted messaging designed to change how you feel — and how you vote — often without you noticing.`,
        },
        {
            emoji: '🏥',
            tag: c('collider_2025:Label').t`Insurance`,
            title: c('collider_2025:Title').t`Health hints can shape your premiums`,
            body: c('collider_2025:Info')
                .t`An offhand mention of stress, a diagnosis, or a medication can feed risk models that quietly affect what cover you're offered and what you pay.`,
        },
        {
            emoji: '💸',
            tag: c('collider_2025:Label').t`Personalised pricing`,
            title: c('collider_2025:Title').t`You might be shown a higher price`,
            body: c('collider_2025:Info')
                .t`If a profile suggests you can pay more — or that you're in a hurry — you may simply see a higher price than the next person.`,
        },
        {
            emoji: '🛒',
            tag: c('collider_2025:Label').t`Data brokers`,
            title: c('collider_2025:Title').t`Your traits get bundled and sold`,
            body: c('collider_2025:Info')
                .t`Inferred details are packaged and traded. A single profile can pass through dozens of companies you've never heard of.`,
        },
        {
            emoji: '🎣',
            tag: c('collider_2025:Label').t`Scams`,
            title: c('collider_2025:Title').t`Detail makes fraud convincing`,
            body: c('collider_2025:Info')
                .t`The more an attacker knows about you, the more believable the phishing message. Personalised scams are far harder to spot.`,
        },
        {
            emoji: '🏦',
            tag: c('collider_2025:Label').t`Lending & hiring`,
            title: c('collider_2025:Title').t`Profiles can decide your future`,
            body: c('collider_2025:Info')
                .t`Automated systems increasingly weigh data profiles in decisions about loans, jobs, and housing — with little transparency or recourse.`,
        },
        {
            emoji: '⏳',
            tag: c('collider_2025:Label').t`It doesn't expire`,
            title: c('collider_2025:Title').t`You can't un-share it`,
            body: c('collider_2025:Info')
                .t`Data collected today can be breached, subpoenaed, or repurposed years from now. Once it's out, it's out.`,
        },
    ];

    const [index, setIndex] = useState(0);
    const [lesson, setLesson] = useState(0);
    const [lessonVisible, setLessonVisible] = useState(true);
    const swapTimeout = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 2600);
        return () => clearInterval(id);
    }, [messages.length]);

    useEffect(() => {
        const id = setInterval(() => {
            // Fade the current lesson out, swap it at the midpoint, then fade the next one in.
            setLessonVisible(false);
            swapTimeout.current = setTimeout(() => {
                setLesson((i) => (i + 1) % lessons.length);
                setLessonVisible(true);
            }, 450);
        }, 6500);
        return () => {
            clearInterval(id);
            if (swapTimeout.current) {
                clearTimeout(swapTimeout.current);
            }
        };
    }, [lessons.length]);

    const current = lessons[lesson];

    return (
        <div className="ai-paper-trail__inner ai-paper-trail__loading">
            <div className="ai-paper-trail__status">
                <span className="ai-paper-trail__loader">
                    <CircleLoader size="medium" />
                </span>
                <span className="ai-paper-trail__status-title">{c('collider_2025:Title')
                    .t`Building your paper trail`}</span>
            </div>
            <p className="ai-paper-trail__status-step" aria-live="polite">
                {messages[index]}
            </p>

            <div className="ai-paper-trail__lesson">
                <span className="ai-paper-trail__lesson-eyebrow">
                    {c('collider_2025:Label').t`While you wait — how your data gets used`}
                </span>
                <div className={clsx('ai-paper-trail__lesson-card', lessonVisible && 'is-visible')} aria-live="polite">
                    <span className="ai-paper-trail__lesson-emoji" aria-hidden="true">
                        {current.emoji}
                    </span>
                    <div className="ai-paper-trail__lesson-body">
                        <span className="ai-paper-trail__lesson-tag">{current.tag}</span>
                        <h3 className="ai-paper-trail__lesson-title">{current.title}</h3>
                        <p className="ai-paper-trail__lesson-text">{current.body}</p>
                    </div>
                </div>
                <div className="ai-paper-trail__lesson-dots" aria-hidden="true">
                    {lessons.map((_, i) => (
                        <span key={i} className={clsx('ai-paper-trail__lesson-dot', i === lesson && 'is-active')} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const AiPaperTrailView = () => {
    const { status, error, conversationId, start, reset } = useStartPaperTrail();
    const navigate = useLumoNavigate();
    const dispatch = useLumoDispatch();

    const handleFile = useCallback(
        (file: File | undefined) => {
            if (file) {
                void start(file);
            }
        },
        [start]
    );

    const handleStartChat = useCallback(() => {
        dispatch(setGhostChatMode(false));
        navigate('/');
    }, [dispatch, navigate]);

    const messagesMap = useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);
    const conversation = useLumoSelector(selectConversationById(conversationId ?? ''));

    const assistantMessage = useMemo(
        () => Object.values(messagesMap).find((m: Message) => m.role === Role.Assistant),
        [messagesMap]
    );

    const isFinished =
        !!conversationId &&
        ((!!conversation && conversation.status !== ConversationStatus.GENERATING) ||
            assistantMessage?.status !== undefined);

    const report = useMemo(
        () => (isFinished ? parsePaperTrailReport(assistantMessage?.content) : undefined),
        [isFinished, assistantMessage?.content]
    );

    let content: JSX.Element;
    if (status === 'idle' || (status === 'error' && !conversationId)) {
        content = <UploadStage onFile={handleFile} error={error} onStartChat={handleStartChat} />;
    } else if (!isFinished) {
        content = <LoadingStage />;
    } else if (report) {
        content = <PaperTrailReportView report={report} onStartOver={reset} onTryLumo={handleStartChat} />;
    } else {
        content = (
            <div className="ai-paper-trail__inner flex flex-column items-center gap-4 text-center">
                <LumoIcon name="CircleAlert" size={32} className="color-danger" />
                <h2 className="ai-paper-trail__title m-0">{c('collider_2025:Title')
                    .t`We couldn't read your paper trail`}</h2>
                <p className="ai-paper-trail__subtitle m-0">
                    {c('collider_2025:Info').t`Something went wrong analysing this export. Please try again.`}
                </p>
                <Button color="norm" pill onClick={reset}>{c('collider_2025:Action').t`Try again`}</Button>
            </div>
        );
    }

    return (
        <div className="ai-paper-trail">
            <PaperTrailHeader onStartChat={handleStartChat} />
            {content}
        </div>
    );
};

export default AiPaperTrailView;
