import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_LUMO_PUB_KEY, RequestEncryptionParams } from '@proton/lumo-api-client';

import { ENABLE_U2L_ENCRYPTION } from '../../../llm/config';
import { downsampleTo16kHzPCM16, int16ArrayToBase64 } from '../../../util/pcmAudio';

// Same-origin as the rest of the app's /api/* calls — see utilities/local-sso/local.cfg
// for how this gets routed to $LUMO_SCHEDULER (or prod) in local dev.
const REALTIME_ENDPOINT = 'ai/v1/realtime';
const AUDIO_BUFFER_SIZE = 4096;
// Non-final commits must be sent periodically while streaming, or the scheduler never starts a
// turn and no deltas come back until the very last (final) commit — see send_mic_audio in
// lumo-infra's python/lumo.py, which flushes a non-final commit every ~1s of audio.
const APPENDS_PER_COMMIT = 12;

// Simple energy-based VAD: skip sending chunks that are just silence/background noise, so we're
// not paying to transcribe (or bandwidth-shipping) dead air. RMS is computed on the raw [-1, 1]
// float samples before downsampling/encoding. The hangover keeps sending for a few chunks after
// volume drops below threshold, so we don't clip a trailing consonant right as someone finishes
// a word — only a genuinely sustained pause gets skipped.
const SILENCE_RMS_THRESHOLD = 0.01;
const SILENCE_HANGOVER_SEC = 2;

interface UseDictationOptions {
    onTranscriptDelta: (text: string) => void;
}

export const useDictation = ({ onTranscriptDelta }: UseDictationOptions) => {
    const [isDictating, setIsDictating] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [dictationError, setDictationError] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const encryptionRef = useRef<RequestEncryptionParams | null>(null);
    const sessionReadyRef = useRef(false);
    const appendsSinceCommitRef = useRef(0);
    const lastVoiceAtRef = useRef(0);
    const wasSendingRef = useRef(true);
    // Set right before we deliberately close the socket (stopDictation), so ws.onclose can tell
    // an intentional stop apart from the connection dropping/failing on its own.
    const intentionalCloseRef = useRef(false);
    // Guards against an async decrypt finishing after the user has cancelled the session.
    const dictationActiveRef = useRef(false);

    // Imperative (no React state/re-render per audio frame) so callers can drive a rAF-based
    // animation off it — returns a 0..1 volume level from the live mic signal.
    const getAudioLevel = useCallback((): number => {
        const analyser = analyserRef.current;
        const data = analyserDataRef.current;
        if (!analyser || !data) return 0;
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
            const normalized = (data[i] - 128) / 128;
            sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        return Math.min(1, rms * 4);
    }, []);

    const cleanupAudioGraph = useCallback(() => {
        processorRef.current?.disconnect();
        processorRef.current = null;
        analyserRef.current?.disconnect();
        analyserRef.current = null;
        analyserDataRef.current = null;
        sourceRef.current?.disconnect();
        sourceRef.current = null;
        void audioContextRef.current?.close();
        audioContextRef.current = null;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    const stopDictation = useCallback(() => {
        dictationActiveRef.current = false;
        intentionalCloseRef.current = true;
        const ws = wsRef.current;
        if (ws) {
            if (ws.readyState === WebSocket.OPEN && sessionReadyRef.current) {
                ws.send(JSON.stringify({ type: 'input_audio_buffer.commit', final: true }));
            }
            // Detach handlers before closing: closing a still-CONNECTING socket can itself fire
            // error/close events (the browser treats the abort as a failed connection), which
            // would otherwise re-set dictationError right after we clear it below.
            ws.onopen = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws.onclose = null;
            ws.close();
        }
        wsRef.current = null;
        sessionReadyRef.current = false;
        encryptionRef.current = null;
        appendsSinceCommitRef.current = 0;
        cleanupAudioGraph();
        setIsDictating(false);
        setIsConnected(false);
        setDictationError(false);
    }, [cleanupAudioGraph]);

    useEffect(
        () => () => {
            if (dictationActiveRef.current) {
                stopDictation();
            }
        },
        [stopDictation]
    );

    const startDictation = useCallback(async () => {
        dictationActiveRef.current = true;
        intentionalCloseRef.current = false;
        setIsConnected(false);
        setDictationError(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!dictationActiveRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }
            streamRef.current = stream;

            const re = /^lumo\.(([a-z]+\.)?proton\.[a-z]+(:\d+)?)$/;
            const match = re.exec(window.location.host || '');
            const host = match ? `lumo-api.${match[1]}` : window.location.host;
            const wsUrl = `wss://${host}/api/${REALTIME_ENDPOINT}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = async () => {
                if (!dictationActiveRef.current || wsRef.current !== ws) {
                    return;
                }
                const encryption = await RequestEncryptionParams.create(undefined, undefined, {
                    enableU2LEncryption: ENABLE_U2L_ENCRYPTION,
                    autoGenerateEncryption: true,
                });
                if (!dictationActiveRef.current || wsRef.current !== ws) {
                    return;
                }

                const sessionUpdate: Record<string, unknown> = { type: 'session.update' };
                if (encryption) {
                    const requestKey = await encryption.encryptRequestKey(DEFAULT_LUMO_PUB_KEY);
                    if (!dictationActiveRef.current || wsRef.current !== ws) {
                        return;
                    }
                    sessionUpdate.lumo = {
                        request_key: requestKey,
                        request_id: encryption.requestId,
                        encrypted: true,
                    };
                }
                if (ws.readyState !== WebSocket.OPEN) {
                    return;
                }
                encryptionRef.current = encryption;
                ws.send(JSON.stringify(sessionUpdate));
                sessionReadyRef.current = true;
                appendsSinceCommitRef.current = 0;
                lastVoiceAtRef.current = performance.now();
                wasSendingRef.current = true;
                setIsConnected(true);

                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;
                const source = audioContext.createMediaStreamSource(stream);
                sourceRef.current = source;

                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;
                analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount);
                source.connect(analyser);

                // ScriptProcessorNode is deprecated but gets us raw Float32 samples synchronously
                // without a separate AudioWorklet module file — fine for this dictation prototype.
                const processor = audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = (event) => {
                    if (ws.readyState !== WebSocket.OPEN) {
                        return;
                    }
                    const input = event.inputBuffer.getChannelData(0);

                    let sumSquares = 0;
                    for (let i = 0; i < input.length; i++) {
                        sumSquares += input[i] * input[i];
                    }
                    const rms = Math.sqrt(sumSquares / input.length);

                    const now = performance.now();
                    if (rms >= SILENCE_RMS_THRESHOLD) {
                        lastVoiceAtRef.current = now;
                    }
                    const isSending = (now - lastVoiceAtRef.current) / 1000 <= SILENCE_HANGOVER_SEC;
                    if (isSending !== wasSendingRef.current) {
                        wasSendingRef.current = isSending;
                        if (!isSending) {
                            // Flush whatever's buffered so the pause itself ends the turn instead
                            // of waiting for more voiced audio (or the final commit at stop) to
                            // trigger transcription of it.
                            if (appendsSinceCommitRef.current > 0 && sessionReadyRef.current) {
                                appendsSinceCommitRef.current = 0;
                                ws.send(JSON.stringify({ type: 'input_audio_buffer.commit', final: false }));
                            }
                        }
                    }
                    if (!isSending) {
                        return;
                    }

                    const pcm16 = downsampleTo16kHzPCM16(input, audioContext.sampleRate);

                    void (async () => {
                        const encryption = encryptionRef.current;
                        const audio: Record<string, unknown> = { format: 'wav' };
                        if (encryption) {
                            const bytes = new Uint8Array(pcm16.byteLength);
                            bytes.set(new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength));
                            audio.data = await encryption.encryptUint8Array(bytes);
                            audio.encrypted = true;
                        } else {
                            audio.data = int16ArrayToBase64(pcm16);
                        }
                        if (ws.readyState !== WebSocket.OPEN) {
                            return;
                        }
                        ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio }));

                        appendsSinceCommitRef.current += 1;
                        if (appendsSinceCommitRef.current >= APPENDS_PER_COMMIT) {
                            appendsSinceCommitRef.current = 0;
                            ws.send(JSON.stringify({ type: 'input_audio_buffer.commit', final: false }));
                        }
                    })();
                };

                source.connect(processor);
                processor.connect(audioContext.destination);
            };

            ws.onmessage = (event) => {
                void (async () => {
                    let message: any;
                    try {
                        message = JSON.parse(event.data);
                    } catch {
                        console.error('[dictation] failed to parse WebSocket message');
                        return;
                    }

                    const decryptField = async (field: { text?: string; encrypted?: boolean } | undefined) => {
                        if (!field) return '';
                        if (field.encrypted && encryptionRef.current) {
                            return encryptionRef.current.decryptString(field.text ?? '');
                        }
                        return field.text ?? '';
                    };

                    if (message.type === 'conversation.item.input_audio_transcription.delta') {
                        const text = await decryptField(message.delta);
                        if (dictationActiveRef.current) {
                            onTranscriptDelta(text);
                        }
                    } else if (message.type === 'error') {
                        console.error('[dictation] server reported an error');
                        if (typeof message.message === 'string' && message.message.includes('inactivity')) {
                            // Not a real failure — the server closes idle sessions on its own.
                            // Treat it the same as the user clicking stop, not a connection error.
                            stopDictation();
                        } else {
                            setDictationError(true);
                            setIsConnected(false);
                            cleanupAudioGraph();
                        }
                    }
                })();
            };

            ws.onerror = () => {
                console.error('[dictation] WebSocket error');
                setDictationError(true);
                setIsConnected(false);
                cleanupAudioGraph();
            };

            ws.onclose = () => {
                sessionReadyRef.current = false;
                if (!intentionalCloseRef.current) {
                    setDictationError(true);
                    setIsConnected(false);
                    cleanupAudioGraph();
                }
            };

            setIsDictating(true);
        } catch {
            const wasActive = dictationActiveRef.current;
            dictationActiveRef.current = false;
            cleanupAudioGraph();
            if (!wasActive) {
                return;
            }
            console.error('[dictation] could not start dictation');
            setIsDictating(false);
            setIsConnected(false);
            setDictationError(true);
        }
    }, [cleanupAudioGraph, onTranscriptDelta, stopDictation]);

    const toggleDictation = useCallback(() => {
        if (isDictating) {
            stopDictation();
        } else {
            void startDictation();
        }
    }, [isDictating, startDictation, stopDictation]);

    return { isDictating, isConnected, dictationError, toggleDictation, getAudioLevel };
};
