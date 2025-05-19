import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';

let model: blazeface.BlazeFaceModel | null = null;
let offscreen: OffscreenCanvas | null = null;

self.onmessage = async (event) => {
    if (event.data.type === 'init') {
        await tf.setBackend('webgl');
        model = await blazeface.load();
        self.postMessage({ type: 'ready' });
    } else if (event.data.type === 'frame' && model) {
        const imageBitmap: ImageBitmap = event.data.imageBitmap;
        if (!offscreen || offscreen.width !== imageBitmap.width || offscreen.height !== imageBitmap.height) {
            offscreen = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        }
        const ctx = offscreen.getContext('2d');
        if (ctx) {
            ctx.drawImage(imageBitmap, 0, 0);
            try {
                const predictions = await model.estimateFaces(offscreen as unknown as HTMLCanvasElement, false);
                self.postMessage({ type: 'result', predictions });
            } catch (e) {
                console.error('[Worker] Prediction error:', e);
            }
        }
        imageBitmap.close();
    }
};
