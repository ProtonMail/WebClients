import { useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { PaperTrailLumoLogoAnimation } from '../PaperTrailLumoLogoAnimation';
import { PaperTrailFakeProgress } from './PaperTrailFakeProgress';

export const LoadingStage = () => {
    const lessons = [
        {
            emoji: '💬',
            tag: c('collider_2025:Label').t`How AI gets more out of you`,
            title: c('collider_2025:Title').t`Every clarification is a new data point`,
            body: c('collider_2025:Info')
                .t`Conversational AI doesn’t just answer — it asks follow-up questions. Each time you add detail (“actually, I’m 34 and based in Berlin”), you hand over another verified fact.`,
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
                .t`An offhand mention of stress, a diagnosis, or a medication can feed risk models that quietly affect what coverage you’re offered and what you pay.`,
        },
        {
            emoji: '💸',
            tag: c('collider_2025:Label').t`Personalized pricing`,
            title: c('collider_2025:Title').t`You might be shown a higher price`,
            body: c('collider_2025:Info')
                .t`If a profile suggests you can pay more or that you’re in a hurry, you may see a higher price than the next person.I`,
        },
        {
            emoji: '🛒',
            tag: c('collider_2025:Label').t`Data brokers`,
            title: c('collider_2025:Title').t`Your traits get bundled and sold`,
            body: c('collider_2025:Info')
                .t`Inferred details are packaged and traded. A single profile can pass through dozens of companies you’ve never heard of.`,
        },
        {
            emoji: '🎣',
            tag: c('collider_2025:Label').t`Scams`,
            title: c('collider_2025:Title').t`Detail makes fraud convincing`,
            body: c('collider_2025:Info')
                .t`The more an attacker knows about you, the more believable the phishing message. Personalized scams are far harder to spot.`,
        },
        {
            emoji: '🏦',
            tag: c('collider_2025:Label').t`Lending & hiring`,
            title: c('collider_2025:Title').t`Profiles can decide your future`,
            body: c('collider_2025:Info')
                .t`Automated systems increasingly weigh data profiles in decisions about loans, jobs, and housing with little transparency or recourse.`,
        },
        {
            emoji: '⏳',
            tag: c('collider_2025:Label').t`It doesn't expire`,
            title: c('collider_2025:Title').t`You can’t un-share it`,
            body: c('collider_2025:Info')
                .t`Data collected today can be breached, subpoenaed, or repurposed years from now. Once it’s out, it’s out.`,
        },
    ];

    const [lesson, setLesson] = useState(0);
    const [lessonVisible, setLessonVisible] = useState(true);
    const swapTimeout = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const id = setInterval(() => {
            setLessonVisible(false);
            swapTimeout.current = setTimeout(() => {
                setLesson((index) => {
                    return (index + 1) % lessons.length;
                });
                setLessonVisible(true);
            }, 450);
        }, 12000);
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
            <div className="ai-paper-trail__loading-hero">
                <PaperTrailLumoLogoAnimation />
                <div className="ai-paper-trail__status">
                    <span className="ai-paper-trail__loader">
                        <CircleLoader size="medium" />
                    </span>
                    <h1 className="ai-paper-trail__status-title">
                        {c('collider_2025:Title').t`Building your AI Paper Trail`}
                    </h1>
                </div>
                <p className="ai-paper-trail__status-subtitle">
                    {c('collider_2025:Info').t`Your report is being generated privately.`}
                </p>
            </div>

            <div className="ai-paper-trail__lesson">
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
                    {lessons.map((_, index) => {
                        return (
                            <span
                                key={index}
                                className={clsx('ai-paper-trail__lesson-dot', index === lesson && 'is-active')}
                            />
                        );
                    })}
                </div>
            </div>

            <PaperTrailFakeProgress />

            <p className="ai-paper-trail__loading-footer">
                {c('collider_2025:Info')
                    .t`${LUMO_SHORT_APP_NAME} is a private AI. Your conversations are encrypted and never used to train AI models.`}
            </p>
        </div>
    );
};
