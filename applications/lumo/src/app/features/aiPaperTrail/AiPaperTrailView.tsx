import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { useLumoNavigate } from '../../hooks/useLumoNavigate';
import { useLumoDispatch, useLumoMemoSelector, useLumoSelector } from '../../redux/hooks';
import { selectConversationById, selectMessagesByConversationId } from '../../redux/selectors';
import { setGhostChatMode } from '../../redux/slices/ghostChat';
import { ConversationStatus, type Message, Role } from '../../types';
import { PaperTrailReportView } from './PaperTrailReportView';
import { parsePaperTrailReport } from './parsePaperTrailReport';
import { useStartPaperTrail } from './useStartPaperTrail';

import './AiPaperTrailView.scss';

const ACCEPTED = '.json,.zip,application/json,application/zip';

const UploadStage = ({ onFile, error }: { onFile: (file: File | undefined) => void; error?: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const steps = [
        {
            title: c('collider_2025:Title').t`Export your history`,
            detail: c('collider_2025:Info')
                .t`Download your data from ChatGPT (Settings → Data Controls → Export) or Claude (Settings → Privacy → Export data).`,
        },
        {
            title: c('collider_2025:Title').t`Upload it privately`,
            detail: c('collider_2025:Info')
                .t`Your file is analysed on the spot to build your report. Nothing is uploaded to our servers or stored.`,
        },
        {
            title: c('collider_2025:Title').t`Meet your AI profile`,
            detail: c('collider_2025:Info')
                .t`See the person Big Tech AI could reconstruct from your words — plus a privacy score you can share.`,
        },
    ];

    return (
        <div className="ai-paper-trail__inner ai-paper-trail__landing">
            <span className="ai-paper-trail__eyebrow">{c('collider_2025:Title').t`AI Paper Trail`}</span>
            <h1 className="ai-paper-trail__title">{c('collider_2025:Title').t`See what AI knows about you`}</h1>
            <p className="ai-paper-trail__subtitle">
                {c('collider_2025:Info')
                    .t`Every prompt you type into ChatGPT or Claude gives something away — your job, your health, your relationships, where you live. Over time it builds into a detailed profile. Upload your chat history and we'll show you the person Big Tech AI could piece together from your words alone, and score how much you've revealed.`}
            </p>
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
                    <IcFileArrowInUp size={8} className="ai-paper-trail__upload-icon" />
                    <span className="text-lg text-semibold">
                        {c('collider_2025:Action').t`Drop your export here or click to browse`}
                    </span>
                    <span className="ai-paper-trail__muted text-sm">
                        {c('collider_2025:Info').t`Supports the .zip or conversations.json from ChatGPT and Claude`}
                    </span>
                </div>
            </div>

            {error && (
                <div className="ai-paper-trail__error flex flex-row flex-nowrap items-start gap-2 mt-4 p-3 rounded">
                    <IcExclamationCircleFilled className="color-danger shrink-0 mt-0.5" size={4} />
                    <span>{error}</span>
                </div>
            )}

            <div className="ai-paper-trail__privacy flex flex-row flex-nowrap items-center gap-2 mt-6">
                <IcLockFilled size={4} className="shrink-0" />
                <span className="text-sm">
                    {c('collider_2025:Info')
                        .t`Your file never leaves your device — it's read locally and is never stored.`}
                </span>
            </div>

            <div className="ai-paper-trail__steps">
                {steps.map((step, i) => (
                    <div key={i} className="ai-paper-trail__step">
                        <span className="ai-paper-trail__step-num">{i + 1}</span>
                        <span className="ai-paper-trail__step-title">{step.title}</span>
                        <span className="ai-paper-trail__step-detail">{step.detail}</span>
                    </div>
                ))}
            </div>

            <p className="ai-paper-trail__footnote">
                {c('collider_2025:Info')
                    .t`This is exactly the kind of profiling ${LUMO_SHORT_APP_NAME} is built to stop. With ${LUMO_SHORT_APP_NAME}, your conversations are encrypted and never used to build a profile of you.`}
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

    const handleTryLumo = useCallback(() => {
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
        content = <UploadStage onFile={handleFile} error={error} />;
    } else if (!isFinished) {
        content = <LoadingStage />;
    } else if (report) {
        content = <PaperTrailReportView report={report} onStartOver={reset} onTryLumo={handleTryLumo} />;
    } else {
        content = (
            <div className="ai-paper-trail__inner flex flex-column items-center gap-4 text-center">
                <IcExclamationCircleFilled className="color-danger" size={8} />
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
            <div className="ai-paper-trail__brand">
                <img src={lumoCatIcon} alt="" className="ai-paper-trail__brand-logo" />
            </div>
            {content}
        </div>
    );
};

export default AiPaperTrailView;
