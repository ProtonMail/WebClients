import { supportsAudioContextSinkId, supportsElementSinkId, supportsSetSinkId } from '../../../utils/browser';
import { Field } from '../Field';
import type { Snapshot } from './snapshot';

export const PlaybackSection = ({ snapshot }: { snapshot: Snapshot }) => (
    <section className="flex flex-column gap-2 w-full border border-weak rounded p-3">
        <h3 className="text-bold text-sm m-0">Playback</h3>
        <Field name="webAudioMix" value={String(snapshot.webAudioMixEnabled)} />
        <Field
            name="canPlaybackAudio"
            value={String(snapshot.canPlaybackAudio)}
            highlight={!snapshot.canPlaybackAudio}
        />
        <Field
            name="audioContext.state"
            value={snapshot.audioContextState}
            highlight={snapshot.audioContextState === 'suspended' || snapshot.audioContextState === 'closed'}
        />
        <Field name="audioContext.sampleRate" value={snapshot.audioContextSampleRate} />
        <Field name="audioContext.sinkId" value={snapshot.audioContextSinkId} />
        <Field name="cameraPermissions" value={snapshot.cameraPermissions} />
        <Field name="microphonePermissions" value={snapshot.microphonePermissions} />

        <Field name="supportsSetSinkId" value={String(supportsSetSinkId())} />
        <Field name="setSinkId (element)" value={String(supportsElementSinkId())} />
        <Field name="setSinkId (context)" value={String(supportsAudioContextSinkId())} />
    </section>
);
