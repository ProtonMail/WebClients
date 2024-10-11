import metrics from '@proton/metrics';
import { reportWebVitals } from '@proton/shared/lib/metrics/webvitals';

import { getCurrentPageType, initializePerformanceMetrics, logPerformanceMarker } from './performance';

jest.mock('@proton/shared/lib/metrics/webvitals', () => ({
    reportWebVitals: jest.fn(),
}));

describe('getCurrentPageType', () => {
    test('should return correct pageType', () => {
        expect(
            getCurrentPageType(
                '/u/14/93b6QQHBOW5gLNeIv8alVi7vVG5131MJdEDvHFkp6tqaxmeKxKIXBupvOI3r3Qk5tBFzImcWIHq3--uPphicyg==/file/7fd9vEITnQ49gWQ0n1yIcGimsfgZMsQBVaVfkCT4kB70hbDvOiedpUZNjINctPkdP9jjublTMKdQQO7E1je92A=='
            )
        ).toEqual('filebrowser');
        expect(
            getCurrentPageType(
                '/u/14/93b6QQHBOW5gLNeIv8alVi7vVG5131MJdEDvHFkp6tqaxmeKxKIXBupvOI3r3Qk5tBFzImcWIHq3--uPphicyg==/folder/7PSPIhQBTPHmNWl21o1EYtOiBiBE_r10buNFU4t6dDfSqmjm07AJXCHsiCGJos2BAz56PJdZ1P-Jeq9sxmGKGQ=='
            )
        ).toEqual('filebrowser');
        expect(getCurrentPageType('/u/14')).toEqual('filebrowser');
        expect(getCurrentPageType('/')).toEqual('filebrowser');
        expect(getCurrentPageType('///')).toEqual('filebrowser');

        expect(getCurrentPageType('/u/0/devices')).toEqual('computers');
        expect(getCurrentPageType('/devices')).toEqual('computers');
        expect(getCurrentPageType('//devices')).toEqual('computers');

        expect(getCurrentPageType('/u/1/shared-urls')).toEqual('shared_by_me');
        expect(getCurrentPageType('/shared-urls')).toEqual('shared_by_me');
        expect(getCurrentPageType('///shared-urls')).toEqual('shared_by_me');

        expect(getCurrentPageType('/u/0/shared-with-me')).toEqual('shared_with_me');
        expect(getCurrentPageType('/shared-with-me')).toEqual('shared_with_me');
        expect(getCurrentPageType('//shared-with-me')).toEqual('shared_with_me');

        expect(getCurrentPageType('/u/0/trash')).toEqual('trash');
        expect(getCurrentPageType('/trash')).toEqual('trash');
        expect(getCurrentPageType('//trash')).toEqual('trash');

        expect(getCurrentPageType('/u/0/photos')).toEqual('photos');
        expect(getCurrentPageType('/photos')).toEqual('photos');
        expect(getCurrentPageType('//photos')).toEqual('photos');

        expect(getCurrentPageType('/u/0/trash')).toEqual('trash');
        expect(getCurrentPageType('/trash')).toEqual('trash');
        expect(getCurrentPageType('//trash')).toEqual('trash');

        expect(getCurrentPageType('/urls/0VTVZ5ZPVR#3JQRGUK74GI5')).toEqual('public_page');
        expect(getCurrentPageType('/urls/0VTVZ5ZPVR')).toEqual('public_page');
        expect(getCurrentPageType('//urls/0VTVZ5ZPVR#3JQRGUK74GI5')).toEqual('public_page');

        expect(getCurrentPageType('/no-access')).toEqual(undefined);
        expect(getCurrentPageType('/u/0/no-access')).toEqual(undefined);
        expect(getCurrentPageType('/u/0///no-access')).toEqual(undefined);
    });
});

describe('Web Performance Metrics', () => {
    beforeAll(() => {
        Object.defineProperty(document, 'readyState', {
            configurable: true,
            get() {
                return 'loading';
            },
        });
    });

    beforeEach(() => {
        jest.useFakeTimers();
        performance.mark = jest.fn();
        performance.getEntriesByType = jest.fn().mockReturnValue([{ startTime: 0 } as PerformanceEntry]);
        performance.getEntriesByName = jest.fn().mockReturnValue([{ duration: 100 } as PerformanceEntry]);
        performance.measure = jest.fn();

        jest.spyOn(metrics.drive_performance_clicktofirstpagerendered_histogram, 'observe');
        jest.spyOn(metrics.drive_performance_clicktolastitemrendered_histogram, 'observe');
        jest.spyOn(metrics.drive_performance_averagetimeperitem_histogram, 'observe');
        jest.spyOn(window, 'addEventListener');
        jest.spyOn(document, 'addEventListener');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('initializePerformanceMetrics: should initialize browser events and report web vitals', () => {
        initializePerformanceMetrics(false);

        expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
        expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
        expect(reportWebVitals).toHaveBeenCalledWith('private');
    });

    it('initializePerformanceMetrics: should use the correct context for web vitals reporting', () => {
        initializePerformanceMetrics(true);
        expect(reportWebVitals).toHaveBeenCalledWith('public');
    });

    it('logPerformanceMarker: should log performance marker and record metrics', () => {
        const result = logPerformanceMarker('drive_performance_clicktofirstpagerendered_histogram', 'list');

        expect(performance.mark).toHaveBeenCalledWith('drive_performance_clicktofirstpagerendered_histogram');
        expect(performance.measure).toHaveBeenCalled();
        expect(metrics.drive_performance_clicktofirstpagerendered_histogram.observe).toHaveBeenCalled();
        expect(result).toBe(100);
    });

    it('logPerformanceMarker: should use provided time if given', () => {
        const result = logPerformanceMarker('drive_performance_clicktofirstpagerendered_histogram', 'grid', 200);

        expect(performance.measure).not.toHaveBeenCalled();
        expect(metrics.drive_performance_clicktofirstpagerendered_histogram.observe).toHaveBeenCalled();
        expect(result).toBe(200);
    });
});
