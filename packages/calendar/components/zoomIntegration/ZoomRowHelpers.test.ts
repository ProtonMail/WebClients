import { shouldReconnectToZoom, shouldSeeLoadingButton, shouldSeeLoginButton } from './ZoomRowHelpers';
import type { ZoomIntegrationState } from './interface';

describe('ZoomRowHelpers', () => {
    describe('shouldSeeLoginButton', () => {
        it.each(['connected', 'disconnected', 'meeting-deleted', 'disconnected-error'])(
            'should return true if the state is %s',
            (state) => {
                expect(shouldSeeLoginButton(state as ZoomIntegrationState)).toBe(true);
            }
        );

        it.each(['loading', 'loadingConfig', 'meeting-present'])('should return false if the state is %s', (state) => {
            expect(shouldSeeLoginButton(state as ZoomIntegrationState)).toBe(false);
        });
    });

    describe('shouldSeeLoadingButton', () => {
        it.each(['loading', 'loadingConfig'])('should return true if the state is %s', (state) => {
            expect(shouldSeeLoadingButton(state as ZoomIntegrationState)).toBe(true);
        });

        it.each(['connected', 'disconnected', 'meeting-deleted', 'meeting-present', 'disconnected-error'])(
            'should return false if the state is %s',
            (state) => {
                expect(shouldSeeLoadingButton(state as ZoomIntegrationState)).toBe(false);
            }
        );
    });

    describe('shouldReconnectToZoom', () => {
        it.each(['disconnected-error', 'disconnected'])('should return true if the state is %s', (state) => {
            expect(shouldReconnectToZoom(state as ZoomIntegrationState)).toBe(true);
        });

        it.each(['connected', 'loading', 'loadingConfig', 'meeting-present', 'meeting-deleted'])(
            'should return false if the state is %s',
            (state) => {
                expect(shouldReconnectToZoom(state as ZoomIntegrationState)).toBe(false);
            }
        );
    });
});
