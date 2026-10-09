import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

import { mergeParticipantDecryptedNameMap } from '@proton/meet/store/slices/participants/participantsSlice';

import {
    CAPTIONS_SIM_ID_PREFIX,
    emitCaptionsSimEvent,
    getCaptionsSimStatus,
    setCaptionsSimStatus,
} from './captionsSimStore';

interface CaptionsSayOptions {
    /** Display name of the speaker. Calls with the same name are attributed to the same participant. */
    speaker?: string;
    /** Average speaking pace; the actual pace fluctuates randomly around it. */
    wordsPerMinute?: number;
}

export interface CaptionsSim {
    /** Turns simulated captions on, going through the loading phase as if waiting for the agent. */
    start(loadingMs?: number): void;
    /** Turns simulated captions off and cancels any caption still being spoken. */
    stop(): void;
    /** Shows the "captions aren't working" state. */
    fail(): void;
    /** Drops the connection to the captions agent, keeping the lines already on screen. */
    loseConnection(): void;
    /** Restores the connection dropped by `loseConnection`. */
    reconnect(): void;
    /** Streams `text` into the captions as the agent would, resolving once it is fully spoken. */
    say(text: string, options?: CaptionsSayOptions): Promise<void>;
    sayShort(options?: CaptionsSayOptions): Promise<void>;
    sayLong(options?: CaptionsSayOptions): Promise<void>;
    /** Two speakers talking over each other for a while. */
    conversation(): Promise<void>;
}

const SHORT_SAMPLE = 'Hey everyone, can you hear me?';

const LONG_SAMPLE =
    'Alright, so let me walk you through where we are with the release. ' +
    'The backend changes landed yesterday and the migration ran without any issues on staging. ' +
    'On the client side we still have two open merge requests, one for the settings page and one for the new onboarding flow, ' +
    'and I expect both of them to be reviewed by the end of the day. ' +
    'If nothing unexpected comes up during QA, we should be able to ship on Thursday. ' +
    'Does anyone have concerns about that timeline?';

const DEFAULT_SPEAKER = 'Simulated Speaker';
const DEFAULT_WORDS_PER_MINUTE = 160;

// nosemgrep: rules_lgpl_javascript_crypto_rule-node-insecure-random-generator -- dev-only speech timing jitter, not security-sensitive
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max + 1));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mimics the STT endpointing: a segment usually ends at a sentence boundary, and a long run-on is
// cut once it has gone on for a while.
const splitIntoSegments = (text: string): string[][] => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const segments: string[][] = [];
    let current: string[] = [];
    let maxLength = randomInt(10, 20);

    for (const word of words) {
        current.push(word);
        const endsSentence = /[.!?]$/.test(word) && current.length >= 3;
        if (endsSentence || current.length >= maxLength) {
            segments.push(current);
            current = [];
            maxLength = randomInt(10, 20);
        }
    }
    if (current.length) {
        segments.push(current);
    }
    return segments;
};

export const createCaptionsSim = (dispatch: Dispatch<UnknownAction>): CaptionsSim => {
    // Bumped by `stop`, so captions still being spoken notice they were cancelled.
    let generation = 0;
    let segmentCounter = 0;
    let loadingTimeout: ReturnType<typeof setTimeout> | undefined;

    const clearLoading = () => {
        clearTimeout(loadingTimeout);
        loadingTimeout = undefined;
    };

    const speakerIdentity = (name: string) => {
        const identity = `${CAPTIONS_SIM_ID_PREFIX}speaker:${name}`;
        dispatch(mergeParticipantDecryptedNameMap({ [identity]: name }));
        return identity;
    };

    const say: CaptionsSim['say'] = async (
        text,
        { speaker = DEFAULT_SPEAKER, wordsPerMinute = DEFAULT_WORDS_PER_MINUTE } = {}
    ) => {
        if (getCaptionsSimStatus() !== 'ready') {
            clearLoading();
            setCaptionsSimStatus('ready');
        }

        const startedIn = generation;
        const cancelled = () => generation !== startedIn;
        const identity = speakerIdentity(speaker);
        const msPerWord = 60000 / Math.max(wordsPerMinute, 1);

        const segments = splitIntoSegments(text);
        for (const [index, words] of segments.entries()) {
            const id = `${CAPTIONS_SIM_ID_PREFIX}${++segmentCounter}`;
            let spoken = 0;

            while (spoken < words.length) {
                const step = Math.min(randomInt(1, 3), words.length - spoken);
                // Interim results arrive in uneven bursts, with the occasional longer hesitation.
                // nosemgrep: rules_lgpl_javascript_crypto_rule-node-insecure-random-generator -- dev-only speech timing jitter, not security-sensitive
                const hesitation = Math.random() < 0.1 ? randomBetween(400, 1000) : 0;
                await sleep(step * msPerWord * randomBetween(0.5, 1.6) + hesitation);
                if (cancelled()) {
                    return;
                }
                spoken += step;
                emitCaptionsSimEvent({
                    type: 'segment',
                    segment: { id, text: words.slice(0, spoken).join(' '), speakerIdentity: identity, isFinal: false },
                });
            }

            // The agent finalises a segment shortly after the speaker pauses.
            await sleep(randomBetween(150, 500));
            if (cancelled()) {
                return;
            }
            emitCaptionsSimEvent({
                type: 'segment',
                segment: { id, text: words.join(' '), speakerIdentity: identity, isFinal: true },
            });

            if (index < segments.length - 1) {
                // Mostly a breath, which the UI merges into the same line; sometimes a real pause.
                // nosemgrep: rules_lgpl_javascript_crypto_rule-node-insecure-random-generator -- dev-only speech timing jitter, not security-sensitive
                await sleep(Math.random() < 0.7 ? randomBetween(100, 900) : randomBetween(1700, 3000));
                if (cancelled()) {
                    return;
                }
            }
        }
    };

    return {
        start(loadingMs = 1500) {
            clearLoading();
            setCaptionsSimStatus('loading');
            loadingTimeout = setTimeout(() => {
                loadingTimeout = undefined;
                setCaptionsSimStatus('ready');
            }, loadingMs);
        },

        stop() {
            generation += 1;
            clearLoading();
            emitCaptionsSimEvent({ type: 'clear' });
            setCaptionsSimStatus('off');
        },

        fail() {
            generation += 1;
            clearLoading();
            emitCaptionsSimEvent({ type: 'clear' });
            setCaptionsSimStatus('failing');
        },

        loseConnection() {
            // Nothing spoken while disconnected reaches us, so captions still being spoken stop here.
            generation += 1;
            clearLoading();
            setCaptionsSimStatus('disconnected');
        },

        reconnect() {
            if (getCaptionsSimStatus() === 'disconnected') {
                setCaptionsSimStatus('ready');
            }
        },

        say,

        sayShort(options) {
            return say(SHORT_SAMPLE, options);
        },

        sayLong(options) {
            return say(LONG_SAMPLE, options);
        },

        async conversation() {
            const startedIn = generation;
            // `say` would turn captions back on, so later lines must not start once stopped.
            const line = (text: string, speaker: string) =>
                generation === startedIn ? say(text, { speaker }) : Promise.resolve();

            await line('Did everyone get a chance to look at the design document I shared this morning?', 'Alice');
            await sleep(randomBetween(400, 1200));
            await Promise.all([
                line('Yes, I went through it. I left a couple of comments on the authentication section.', 'Bob'),
                sleep(randomBetween(1500, 2500)).then(() => line('Same here, looks good overall.', 'Alice')),
            ]);
            await sleep(randomBetween(400, 1200));
            await line(LONG_SAMPLE, 'Bob');
        },
    };
};
