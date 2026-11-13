import './mockTelemetry';
import { telemetry } from '@proton/shared/lib/telemetry';

describe('mockTelemetry', () => {
    it('lets modules that call `new ProtonTelemetry()` load', () => {
        expect(telemetry).toBeDefined();
    });
});
