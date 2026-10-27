import { defineFixtureJourneys } from './autofill-fixtures.journeys';
import { defineRecordedPageJourneys } from './autofill-recorded.journeys';
import { createModelWorker } from './model';

jest.mock('../app/worker/channel');

const worker = createModelWorker('bundled');

describe('Autofill on the bundled detection model', () => {
    defineFixtureJourneys(worker);
    defineRecordedPageJourneys(worker);
});
