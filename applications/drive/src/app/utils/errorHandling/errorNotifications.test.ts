import type { NotificationsManager } from '@proton/components/containers/notifications/manager';

import { setNotificationsManager } from '../../modules/notifications/notifications.singleton';
import { sendErrorReport } from '../../utils/errorHandling';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { showAggregatedErrorNotification } from './errorNotifications';

jest.mock('../../utils/errorHandling', () => ({
    sendErrorReport: jest.fn(),
    isIgnoredError: jest.requireActual('../../utils/errorHandling').isIgnoredError,
}));

const makeMockManager = (): NotificationsManager => ({
    createNotification: jest.fn().mockReturnValue(1),
    removeNotification: jest.fn(),
    hideNotification: jest.fn(),
    clearNotifications: jest.fn(),
    setOffset: jest.fn(),
    removeDuplicate: jest.fn(),
});

describe('showAggregatedErrorNotification', () => {
    let manager: NotificationsManager;

    beforeEach(() => {
        manager = makeMockManager();
        setNotificationsManager(manager);
    });

    afterEach(() => {
        setNotificationsManager(null);
        jest.clearAllMocks();
    });

    it('does nothing when errors array is empty', () => {
        showAggregatedErrorNotification(
            [],
            () => 'msg',
            () => 'fallback'
        );
        expect(manager.createNotification).not.toHaveBeenCalled();
    });

    it('does nothing when all errors are ignored (AbortError)', () => {
        const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
        showAggregatedErrorNotification(
            [abort],
            () => 'msg',
            () => 'fallback'
        );
        expect(manager.createNotification).not.toHaveBeenCalled();
    });

    it('shows getMessage result when there is one error', () => {
        const err = new Error('something went wrong');
        showAggregatedErrorNotification(
            [err],
            () => 'mapped message',
            () => 'fallback'
        );
        expect(manager.createNotification).toHaveBeenCalledWith({ type: 'error', text: 'mapped message' });
    });

    it('shows fallback message when errors produce different messages', () => {
        const errors = [new Error('a'), new Error('b')];
        showAggregatedErrorNotification(
            errors,
            (e) => e.message,
            () => 'fallback message'
        );
        expect(manager.createNotification).toHaveBeenCalledWith({ type: 'error', text: 'fallback message' });
    });

    it('shows unified message when all errors produce the same message', () => {
        const errors = [new Error('same'), new Error('same')];
        showAggregatedErrorNotification(
            errors,
            (e) => e.message,
            () => 'fallback'
        );
        expect(manager.createNotification).toHaveBeenCalledWith({ type: 'error', text: 'same' });
    });

    it('shows ValidationError message directly and skips getMessage for it', () => {
        const err = new ValidationError('invalid input');
        showAggregatedErrorNotification(
            [err],
            () => 'should not appear',
            () => 'fallback'
        );
        expect(manager.createNotification).toHaveBeenCalledWith({ type: 'error', text: 'invalid input' });
        expect(manager.createNotification).not.toHaveBeenCalledWith(
            expect.objectContaining({ text: 'should not appear' })
        );
    });

    it('deduplicates ValidationErrors with the same message', () => {
        const errors = [new ValidationError('dup'), new ValidationError('dup')];
        showAggregatedErrorNotification(
            errors,
            () => 'msg',
            () => 'fallback'
        );
        expect(manager.createNotification).toHaveBeenCalledTimes(1);
    });

    it('calls sendErrorReport for each error', () => {
        const errors = [new Error('a'), new Error('b')];
        showAggregatedErrorNotification(
            errors,
            (e) => e.message,
            () => 'fallback'
        );
        expect(sendErrorReport).toHaveBeenCalledTimes(2);
    });

    it('infers T from the array so getMessage receives the typed element', () => {
        const items = [{ uid: '1', error: 'not found' }];
        showAggregatedErrorNotification(
            items,
            (item) => item.error,
            () => 'fallback'
        );
        expect(manager.createNotification).toHaveBeenCalledWith({ type: 'error', text: 'not found' });
    });
});
