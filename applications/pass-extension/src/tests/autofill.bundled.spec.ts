// @vitest-environment jsdom
/** jsdom: happy-dom's CSS cascade detects other fields than a browser on the recorded pages (amazon, bitwarden, paypal) */
import { defineFixtureJourneys } from './autofill-fixtures.journeys';
import { defineRecordedPageJourneys } from './autofill-recorded.journeys';
import { createModelWorker } from './model';

vi.mock('../app/worker/channel');

const worker = createModelWorker('bundled');

describe('Autofill on the bundled detection model', () => {
    defineFixtureJourneys(worker);
    defineRecordedPageJourneys(worker);
});
