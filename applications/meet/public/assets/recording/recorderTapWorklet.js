// AudioWorklet that taps the recording audio mix and posts batched PCM
// (planar Float32) to the main thread for the WebCodecs recorder.
//
// Plain JS on purpose: AudioWorklet modules run in their own global scope and
// are served as a static asset (see audioMixer.startWorkletTap), not bundled.

const TARGET_FRAMES = 1024; // ~21ms at 48kHz; batches quanta to cut messaging.

class RecorderTapProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffers = null;
        this._filled = 0;
        this._startFrame = 0;
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || input.length === 0 || !input[0] || input[0].length === 0) {
            return true;
        }

        const numChannels = input.length;
        const frames = input[0].length;

        if (!this._buffers) {
            this._buffers = [];
            for (let c = 0; c < numChannels; c++) {
                this._buffers.push(new Float32Array(TARGET_FRAMES));
            }
            this._filled = 0;
            this._startFrame = currentFrame;
        }

        for (let c = 0; c < numChannels; c++) {
            this._buffers[c].set(input[c], this._filled);
        }
        this._filled += frames;

        if (this._filled >= TARGET_FRAMES) {
            this.port.postMessage({ channels: this._buffers, frame: this._startFrame, sampleRate });
            this._buffers = null;
        }

        return true;
    }
}

registerProcessor('recorder-tap', RecorderTapProcessor);
