/**
 * Realtime speech-to-text requires raw PCM16LE mono audio at 16kHz, with no server-side
 * resampling (wrong sample rate silently yields an empty transcript). Browsers give us
 * Float32 audio at whatever the device's native sample rate is (commonly 44.1/48kHz), so we
 * downsample and requantize by hand instead of relying on codec support.
 */
const REALTIME_AUDIO_SAMPLE_RATE = 16000;

function floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const clamped = Math.max(-1, Math.min(1, input[i]));
        output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return output;
}

/** Nearest-neighbor downsample is good enough for speech dictation; avoids pulling in a resampling lib. */
export function downsampleTo16kHzPCM16(input: Float32Array, inputSampleRate: number): Int16Array {
    if (inputSampleRate === REALTIME_AUDIO_SAMPLE_RATE) {
        return floatTo16BitPCM(input);
    }
    const ratio = inputSampleRate / REALTIME_AUDIO_SAMPLE_RATE;
    const outputLength = Math.round(input.length / ratio);
    const resampled = new Float32Array(outputLength);
    for (let i = 0; i < outputLength; i++) {
        resampled[i] = input[Math.floor(i * ratio)];
    }
    return floatTo16BitPCM(resampled);
}

export function int16ArrayToBase64(samples: Int16Array): string {
    const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
