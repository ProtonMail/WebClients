import { defineFixtureJourneys } from './autofill-fixtures.journeys';
import { defineRecordedPageJourneys } from './autofill-recorded.journeys';
import { createModelWorker } from './model';

jest.mock('../app/worker/channel');

const worker = createModelWorker('challenger');

/** Skipped when the jest global setup could not download the remote models */
(worker.available ? describe : describe.skip)('Autofill on the challenger detection model', () => {
    defineFixtureJourneys(worker);
    defineRecordedPageJourneys(worker);
});
