import { WAIT_TIME } from '../constants';

export function waitForCondition(callback: () => boolean) {
    return new Promise<void>((resolve) => {
        const waitForCondition = () => {
            if (callback()) {
                return resolve();
            }
            setTimeout(waitForCondition, WAIT_TIME);
        };
        waitForCondition();
    });
}

export class Pauser {
    isPaused = false;

    abortController = new AbortController();

    pause() {
        this.isPaused = true;
        this.abortController.abort();
    }

    resume() {
        this.abortController = new AbortController();
        this.isPaused = false;
    }

    async waitIfPaused() {
        await waitForCondition(() => !this.isPaused);
    }
}
