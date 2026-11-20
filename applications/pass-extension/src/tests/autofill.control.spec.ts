// @vitest-environment jsdom
/** jsdom: happy-dom's CSS cascade detects other fields than a browser on the recorded pages (amazon, bitwarden, paypal) */
import { defineFixtureJourneys } from './autofill-fixtures.journeys';
import { defineRecordedPageJourneys } from './autofill-recorded.journeys';
import { createModelWorker } from './model';

vi.mock('../app/worker/channel');

const worker = createModelWorker('control');

/** Skipped when the jest global setup could not download the remote models */
(worker.available ? describe : describe.skip)('Autofill on the control detection model', () => {
    defineFixtureJourneys(worker);
    defineRecordedPageJourneys(worker);
});
