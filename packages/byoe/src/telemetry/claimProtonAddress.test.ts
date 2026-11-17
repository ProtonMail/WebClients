import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { mockTracker } from '@proton/telemetry-tracker/testing';

import { BYOE_CLAIM_PROTON_ADDRESS_SOURCE } from '../constants';
import {
    trackAccountImportClaimProtonAddressClicked,
    trackAccountImportClaimProtonAddressCompleted,
} from './claimProtonAddress';

describe('claim Proton address telemetry', () => {
    it('describes the claim of a Proton address with its source and no time', () => {
        const { reports, restore } = mockTracker();

        trackAccountImportClaimProtonAddressClicked(BYOE_CLAIM_PROTON_ADDRESS_SOURCE.OPEN_CALENDAR_APP);
        trackAccountImportClaimProtonAddressCompleted(BYOE_CLAIM_PROTON_ADDRESS_SOURCE.MAIL_COMPOSER);

        expect(reports.map(({ measurementGroup }) => measurementGroup)).toEqual([
            TelemetryMeasurementGroups.accountImportFlow,
            TelemetryMeasurementGroups.accountImportFlow,
        ]);
        expect(reports.map(({ event }) => event)).toEqual(['step_interacted', 'step_completed']);
        expect(reports[0].dimensions).toEqual({
            flow: 'byoe',
            step: 'claim_proton_address',
            action: 'claim',
            source: 'open-calendar-app',
        });
        expect(reports[1].dimensions).toEqual({
            flow: 'byoe',
            step: 'claim_proton_address',
            source: 'mail-composer',
        });
        expect(reports[1].values).not.toHaveProperty('activeMs');

        restore();
    });
});
