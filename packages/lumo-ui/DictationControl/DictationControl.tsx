import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

import './DictationControl.scss';

export interface DictationControlLabels {
    connectionError: string;
    listening: string;
    connecting: string;
    cancel: string;
    accept: string;
}

interface Props {
    isDictating: boolean;
    isConnected?: boolean;
    hasError?: boolean;
    getAudioLevel: () => number;
    onCancel: () => void;
    onAccept: () => void;
    children: ReactNode;
    labels?: Partial<DictationControlLabels>;
}

const ATTACK_SMOOTHING = 0.4;
const RELEASE_SMOOTHING = 0.12;
const WAVEFORM_GAIN = 2;
const BAR_GAINS = [0.55, 0.8, 1.1, 1.4, 1.1, 0.8, 0.55];

const DictationControl = ({
    isDictating,
    isConnected = false,
    hasError = false,
    getAudioLevel,
    onCancel,
    onAccept,
    children,
    labels,
}: Props) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const smoothedLevelRef = useRef(0);

    const resolvedLabels: DictationControlLabels = {
        connectionError: c('Info').t`Connection error`,
        listening: c('Info').t`Listening…`,
        connecting: c('Info').t`Connecting…`,
        cancel: c('Action').t`Cancel dictation`,
        accept: c('Action').t`Accept dictation`,
        ...labels,
    };

    useEffect(() => {
        const setWaveformLevel = (level: number) => {
            waveformRef.current?.querySelectorAll<HTMLElement>('i').forEach((bar, index) => {
                const scale = 0.25 + level * BAR_GAINS[index];
                bar.style.transform = `scaleY(${scale})`;
            });
        };

        if (!isDictating || hasError) {
            smoothedLevelRef.current = 0;
            setWaveformLevel(0);
            return;
        }

        let rafId: number;
        const tick = () => {
            const raw = getAudioLevel();
            const smoothing = raw > smoothedLevelRef.current ? ATTACK_SMOOTHING : RELEASE_SMOOTHING;
            smoothedLevelRef.current += (raw - smoothedLevelRef.current) * smoothing;
            setWaveformLevel(Math.min(1, smoothedLevelRef.current * WAVEFORM_GAIN));
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafId);
    }, [isDictating, hasError, getAudioLevel]);

    return (
        <div
            className={clsx(
                'lumo-dictation-control relative inline-flex flex-nowrap items-center justify-center',
                isDictating && 'lumo-dictation-control--active'
            )}
        >
            <div
                className={clsx(
                    'lumo-dictation-control__trigger absolute inset-0 m-auto flex flex-nowrap items-center justify-center',
                    isDictating && 'lumo-dictation-control__trigger--hidden'
                )}
            >
                {children}
            </div>

            <div
                className={clsx(
                    'lumo-dictation-control__listening absolute inset-0 z-2 flex flex-nowrap items-center justify-end gap-1.5',
                    isDictating && 'lumo-dictation-control__listening--visible',
                    hasError && 'lumo-dictation-control__listening--error'
                )}
            >
                <span className="lumo-dictation-control__status text-sm color-hint text-nowrap">
                    {hasError
                        ? resolvedLabels.connectionError
                        : isConnected
                          ? resolvedLabels.listening
                          : resolvedLabels.connecting}
                </span>
                <div
                    ref={waveformRef}
                    className={clsx(
                        'lumo-dictation-control__waveform flex flex-nowrap items-center gap-0.5',
                        !isConnected && 'lumo-dictation-control__waveform--connecting'
                    )}
                    aria-hidden="true"
                >
                    {BAR_GAINS.map((_, index) => (
                        <i key={index} className="rounded-sm" />
                    ))}
                </div>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="border-0 shrink-0"
                    onClick={onCancel}
                    title={resolvedLabels.cancel}
                    aria-label={resolvedLabels.cancel}
                >
                    <IcCross size={4} />
                </Button>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="border-0 shrink-0"
                    onClick={onAccept}
                    title={resolvedLabels.accept}
                    aria-label={resolvedLabels.accept}
                >
                    <IcCheckmark size={4} />
                </Button>
            </div>
        </div>
    );
};

export default DictationControl;
