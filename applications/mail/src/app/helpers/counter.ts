import { Counter } from '../models/counter';

export const replaceCounter = (counters: Counter[], counter: Counter) =>
    counters.map((existingCounter: any) => {
        if (existingCounter.LabelID === counter.LabelID) {
            return counter;
        }
        return existingCounter;
    });
