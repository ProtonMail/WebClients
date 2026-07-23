import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Toggle } from '@proton/components/index';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSelectedCameraId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import clsx from '@proton/utils/clsx';

import { CustomBackgroundPreview } from './CustomBackgroundPreview';

type BackgroundMode = 'color' | 'image';

const DEFAULT_COLOR = '#1b1340';

const showTester = !isProduction(window.location.host);

export const CustomBackgroundTester = () => {
    const selectedCameraId = useMeetSelector(selectSelectedCameraId);

    const [mode, setMode] = useState<BackgroundMode>('color');
    const [color, setColor] = useState(DEFAULT_COLOR);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    useEffect(() => {
        // Acquire the camera only on explicit opt-in, so the tester doesn't grab a
        // second camera handle on mount.
        if (!showTester || !cameraEnabled) {
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
    }, [cameraEnabled, selectedCameraId]);

    if (!showTester) {
        return null;
    }

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        setMode('image');
        setImageUrl((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }
            return URL.createObjectURL(file);
        });
    };

    const activeBackgroundColor = mode === 'color' ? color : undefined;
    const activeImageUrl = mode === 'image' ? (imageUrl ?? undefined) : undefined;

    const renderPreview = () => {
        if (!cameraEnabled) {
            return <p className="debug-empty">{c('Info').t`Enable the camera to preview the custom background.`}</p>;
        }
        if (cameraError) {
            return <p className="debug-empty">{c('Info').t`Could not access the camera.`}</p>;
        }
        if (!cameraStream) {
            return <p className="debug-empty">{c('Info').t`Starting camera…`}</p>;
        }
        if (mode === 'image' && !activeImageUrl) {
            return <p className="debug-empty">{c('Info').t`Upload an image to preview it as the background.`}</p>;
        }

        return (
            <div className="w-full">
                <CustomBackgroundPreview
                    stream={cameraStream}
                    backgroundColor={activeBackgroundColor}
                    imageUrl={activeImageUrl}
                    label={mode === 'color' ? c('Label').t`Solid color` : c('Label').t`Uploaded image`}
                />
            </div>
        );
    };

    return (
        <div className="debug-section">
            <h3>{c('Title').t`Custom background tester`}</h3>
            <p className="debug-empty">
                {c('Info')
                    .t`Run your live camera through the custom background processor. Pick a plain color or upload an image to use as the background.`}
            </p>

            <div className="debug-section flex gap-8 flex-wrap items-center">
                <div className="flex gap-2 items-center">
                    <label className="setting-label color-norm" htmlFor="custom-bg-camera">
                        {c('Label').t`Use live camera feed`}
                    </label>
                    <Toggle
                        id="custom-bg-camera"
                        checked={cameraEnabled}
                        onChange={() => setCameraEnabled((previous) => !previous)}
                        className={clsx('settings-toggle', cameraEnabled ? '' : 'settings-toggle-inactive')}
                    />
                </div>

                <div className="flex gap-2 items-center">
                    <label className="setting-label color-norm" htmlFor="custom-bg-mode-color">
                        {c('Label').t`Solid color`}
                    </label>
                    <Button
                        id="custom-bg-mode-color"
                        size="small"
                        shape={mode === 'color' ? 'solid' : 'outline'}
                        onClick={() => setMode('color')}
                    >
                        {c('Action').t`Use color`}
                    </Button>
                    <input
                        type="color"
                        aria-label={c('Label').t`Background color`}
                        value={color}
                        onChange={(event) => {
                            setColor(event.target.value);
                            setMode('color');
                        }}
                        style={{ width: '2.5rem', height: '2rem', padding: 0, cursor: 'pointer' }}
                    />
                </div>

                <div className="flex gap-2 items-center">
                    <label className="setting-label color-norm" htmlFor="custom-bg-mode-image">
                        {c('Label').t`Image`}
                    </label>
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} hidden />
                    <Button
                        id="custom-bg-mode-image"
                        size="small"
                        shape="outline"
                        onClick={() => imageInputRef.current?.click()}
                    >
                        {imageUrl ? c('Action').t`Upload another image` : c('Action').t`Upload image`}
                    </Button>
                    {imageUrl && (
                        <Button
                            size="small"
                            shape={mode === 'image' ? 'solid' : 'outline'}
                            onClick={() => setMode('image')}
                        >
                            {c('Action').t`Use image`}
                        </Button>
                    )}
                </div>
            </div>

            {renderPreview()}
        </div>
    );
};
