import observeApiError from '../lib/observeApiError';

const metricObserver = jest.fn();

describe('observeApiError', () => {
    it('ignores reporting if error is undefined', () => {
        observeApiError(undefined, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('ignores reporting if error is null', () => {
        observeApiError(null, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('ignores reporting if error is not an object', () => {
        observeApiError('string', metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('ignores reporting if status is -1 (offline)', () => {
        observeApiError({ status: -1 }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('ignores reporting if status is 0', () => {
        observeApiError({ status: 0 }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('ignores reporting if error does not contain a status property', () => {
        observeApiError('', metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('ignores reporting if it is an abort error', () => {
        observeApiError({ name: 'AbortError ' }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('ignores reporting if it is an HV error', () => {
        observeApiError({ status: 422, data: { Error: 'HV required', Code: 9001 } }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(0);
    });

    it('returns 5xx if error.status is 500', () => {
        observeApiError({ status: 500 }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(1);
        expect(metricObserver).toHaveBeenCalledWith('5xx');
    });

    it('returns 5xx if error.status is larger than 500', () => {
        observeApiError({ status: 501 }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(1);
        expect(metricObserver).toHaveBeenCalledWith('5xx');
    });

    it('returns 4xx if error.status is 400', () => {
        observeApiError({ status: 400 }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(1);
        expect(metricObserver).toHaveBeenCalledWith('4xx');
    });

    it('returns 4xx if error.status is larger than 400', () => {
        observeApiError({ status: 401 }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(1);
        expect(metricObserver).toHaveBeenCalledWith('4xx');
    });

    it('returns failure if error.status is not in the correct range', () => {
        observeApiError({ status: 200 }, metricObserver);

        expect(metricObserver).toHaveBeenCalledTimes(1);
        expect(metricObserver).toHaveBeenCalledWith('failure');
    });
});
