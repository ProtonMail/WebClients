import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Toggle } from '@proton/components/index';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSelectedCameraId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import clsx from '@proton/utils/clsx';

import type { TunableConstants } from '../../../processors/background-processor/tunableConstants';
import { getDefaultTunableConstants } from '../../../processors/background-processor/tunableConstants';
import { BlurConstantsPanel } from './BlurConstantsPanel';
import { BlurPreview } from './BlurPreview';
import { BlurRecorder } from './BlurRecorder';

import './BackgroundBlurComparison.scss';

type SourceMode = 'upload' | 'camera';

const showComparison = !isProduction(window.location.host);

export const BackgroundBlurComparison = () => {
    const selectedCameraId = useMeetSelector(selectSelectedCameraId);

    const [mode, setMode] = useState<SourceMode>('upload');
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [useSimpleSegmentation, setUseSimpleSegmentation] = useState(false);
    const [advancedMode, setAdvancedMode] = useState(false);
    const [constantDefaults] = useState<TunableConstants>(() => getDefaultTunableConstants());
    const [constants, setConstants] = useState<TunableConstants>(constantDefaults);
    const [appliedConstants, setAppliedConstants] = useState<TunableConstants>(constantDefaults);
    const [applyGeneration, setApplyGeneration] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [fileUrl]);

    useEffect(() => {
        if (mode !== 'camera') {
            return;
        }

        let cancelled = false;
        let stream: MediaStream | null = null;
        setCameraError(false);

        void (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
                    audio: false,
                });
                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                setCameraStream(stream);
            } catch {
                if (!cancelled) {
                    setCameraError(true);
                }
            }
        })();

        return () => {
            cancelled = true;
            setCameraStream(null);
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [mode, selectedCameraId]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setIsPaused(false);
        setFileUrl((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }
            return URL.createObjectURL(file);
        });
    };

    const isCamera = mode === 'camera';
    // Changing the key remounts both previews when the source changes.
    const sourceKey = isCamera ? (cameraStream?.id ?? 'no-camera') : (fileUrl ?? 'no-file');

    const handleConstantChange = (key: keyof TunableConstants, value: number) => {
        setConstants((previous) => ({ ...previous, [key]: value }));
    };

    const handleConstantsReset = () => {
        setConstants(constantDefaults);
    };

    const handleConstantsApply = () => {
        setAppliedConstants(constants);
        setApplyGeneration((previous) => previous + 1);
    };

    const isConstantsDirty = (Object.keys(constants) as (keyof TunableConstants)[]).some(
        (key) => constants[key] !== appliedConstants[key]
    );

    const renderPreviews = () => {
        if (isCamera) {
            if (cameraError) {
                return <p className="debug-empty">{c('Info').t`Could not access the camera.`}</p>;
            }
            if (!cameraStream) {
                return <p className="debug-empty">{c('Info').t`Starting camera…`}</p>;
            }
        } else if (!fileUrl) {
            return null;
        }

        const sharedProps = {
            fileUrl: isCamera ? undefined : (fileUrl ?? undefined),
            stream: isCamera ? (cameraStream ?? undefined) : undefined,
            paused: isPaused,
            useSimpleSegmentation,
        };

        if (advancedMode) {
            return (
                <>
                    <div className="w-full mb-4">
                        <BlurPreview
                            key={`advanced-${sourceKey}-${applyGeneration}`}
                            label={c('Label').t`Preview`}
                            hideHeader
                            constantOverrides={appliedConstants}
                            {...sharedProps}
                        />
                    </div>
                    <BlurConstantsPanel
                        values={constants}
                        defaults={constantDefaults}
                        onChange={handleConstantChange}
                        onReset={handleConstantsReset}
                        onApply={handleConstantsApply}
                        isDirty={isConstantsDirty}
                    />
                </>
            );
        }

        return (
            <div className="debug-blur-comparison grid gap-4">
                <BlurPreview key={sourceKey} label={c('Label').t`Preview`} {...sharedProps} />
            </div>
        );
    };

    return (
        <div className="debug-section">
            {showComparison && (
                <>
                    <h3>{c('Title').t`Background blur preview`}</h3>
                    <p className="debug-empty">
                        {advancedMode
                            ? c('Info')
                                  .t`Advanced mode: tune every blur constant, then Apply to rebuild the preview. Overrides take precedence over file and Unleash values.`
                            : c('Info').t`Loop an uploaded video or your live camera through background blur.`}
                    </p>

                    <div className="debug-section flex gap-8 flex-wrap items-center">
                        <div className="flex gap-2 items-center">
                            <label className="setting-label color-norm" htmlFor="blur-comparison-camera">
                                {c('Label').t`Use live camera feed`}
                            </label>
                            <Toggle
                                id="blur-comparison-camera"
                                checked={isCamera}
                                onChange={() => {
                                    setIsPaused(false);
                                    setMode((previous) => (previous === 'camera' ? 'upload' : 'camera'));
                                }}
                                className={clsx('settings-toggle', isCamera ? '' : 'settings-toggle-inactive')}
                            />
                        </div>

                        <div className="flex gap-2 items-center">
                            <label className="setting-label color-norm" htmlFor="blur-comparison-simple-segmentation">
                                {c('Label').t`Use simple selfie segmentation`}
                            </label>
                            <Toggle
                                id="blur-comparison-simple-segmentation"
                                checked={useSimpleSegmentation}
                                onChange={() => setUseSimpleSegmentation((previous) => !previous)}
                                className={clsx(
                                    'settings-toggle',
                                    useSimpleSegmentation ? '' : 'settings-toggle-inactive'
                                )}
                            />
                        </div>

                        <div className="flex gap-2 items-center">
                            <label className="setting-label color-norm" htmlFor="blur-comparison-advanced">
                                {c('Label').t`Advanced mode`}
                            </label>
                            <Toggle
                                id="blur-comparison-advanced"
                                checked={advancedMode}
                                onChange={() => setAdvancedMode((previous) => !previous)}
                                className={clsx('settings-toggle', advancedMode ? '' : 'settings-toggle-inactive')}
                            />
                        </div>
                    </div>

                    {!isCamera && (
                        <>
                            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} hidden />
                            <div className="flex gap-2 flex-wrap mb-4">
                                <Button size="small" shape="outline" onClick={() => fileInputRef.current?.click()}>
                                    {fileUrl ? c('Action').t`Upload another video` : c('Action').t`Upload video`}
                                </Button>
                                {fileUrl && (
                                    <Button
                                        size="small"
                                        shape="outline"
                                        onClick={() => setIsPaused((previous) => !previous)}
                                    >
                                        {isPaused ? c('Action').t`Resume` : c('Action').t`Pause`}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                    {renderPreviews()}
                </>
            )}

            <BlurRecorder selectedCameraId={selectedCameraId} />
        </div>
    );
};
