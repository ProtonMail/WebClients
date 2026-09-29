import { telemetry } from '@proton/shared/lib/telemetry';

import {
    bucketArtifactContentLength,
    bucketArtifactLanguage,
    bucketArtifactPanelOpenDuration,
    capArtifactPosition,
    sendArtifactContentCopiedEvent,
    sendArtifactCreatedEvent,
    sendArtifactCreationDefaultChangedEvent,
    sendArtifactCreationToggledEvent,
    sendArtifactDownloadedEvent,
    sendArtifactInlineActionSentEvent,
    sendArtifactPanelClosedEvent,
    sendArtifactPanelOpenedEvent,
    sendArtifactRevisedEvent,
    sendArtifactSaveToDriveCompletedEvent,
    sendArtifactTurnContextEvent,
    sendArtifactWebpageViewToggledEvent,
    setLumoTelemetryEnabled,
} from './telemetry';

jest.mock('@proton/shared/lib/telemetry', () => {
    return { telemetry: { sendCustomEvent: jest.fn() } };
});

describe('bucketArtifactContentLength', () => {
    it('buckets content under 1k characters', () => {
        expect(bucketArtifactContentLength(0)).toBe('0-1k');
        expect(bucketArtifactContentLength(999)).toBe('0-1k');
    });

    it('buckets content between 1k and 10k characters', () => {
        expect(bucketArtifactContentLength(1000)).toBe('1k-10k');
        expect(bucketArtifactContentLength(9999)).toBe('1k-10k');
    });

    it('buckets content at 10k characters and above', () => {
        expect(bucketArtifactContentLength(10000)).toBe('10k+');
        expect(bucketArtifactContentLength(50000)).toBe('10k+');
    });
});

describe('bucketArtifactLanguage', () => {
    it('normalizes aliases onto the canonical name', () => {
        expect(bucketArtifactLanguage('py')).toBe('python');
        expect(bucketArtifactLanguage(' TypeScript ')).toBe('typescript');
        expect(bucketArtifactLanguage('sh')).toBe('shell');
    });

    it('maps unknown and missing languages to fixed values', () => {
        expect(bucketArtifactLanguage('brainfuck')).toBe('other');
        expect(bucketArtifactLanguage(undefined)).toBe('none');
    });
});

describe('capArtifactPosition', () => {
    it('caps the ordinal at 10', () => {
        expect(capArtifactPosition(3)).toBe(3);
        expect(capArtifactPosition(42)).toBe(10);
    });
});

describe('bucketArtifactPanelOpenDuration', () => {
    it('buckets by the lower bound of each range', () => {
        expect(bucketArtifactPanelOpenDuration(9_999)).toBe('0-10s');
        expect(bucketArtifactPanelOpenDuration(10_000)).toBe('10s-1m');
        expect(bucketArtifactPanelOpenDuration(60_000)).toBe('1m-5m');
        expect(bucketArtifactPanelOpenDuration(300_000)).toBe('5m+');
    });
});

/**
 * The payloads are the contract with the data team: a property that appears, disappears or
 * changes type breaks their dashboards. If a snapshot fails, an intended change is updated here
 * and told to the data team; an unintended one is a bug in the caller.
 */
describe('artifact event payloads', () => {
    const sendCustomEvent = telemetry.sendCustomEvent as jest.Mock;

    beforeEach(() => {
        sendCustomEvent.mockClear();
        setLumoTelemetryEnabled(true);
    });

    afterAll(() => {
        setLumoTelemetryEnabled(false);
    });

    it('sends nothing while telemetry is disabled', () => {
        setLumoTelemetryEnabled(false);
        sendArtifactContentCopiedEvent({ artifactType: 'code', layout: 'docked' });

        expect(sendCustomEvent).not.toHaveBeenCalled();
    });

    it('matches the agreed payloads', () => {
        sendArtifactCreationToggledEvent(true, 'conversation');
        sendArtifactCreationDefaultChangedEvent(false);
        sendArtifactTurnContextEvent({ generationType: 'new', artifactToolMode: 'auto', hasExistingArtifact: false });
        sendArtifactCreatedEvent({
            artifactType: 'code',
            artifactToolMode: 'auto',
            artifactPosition: 1,
            contentLengthBucket: '1k-10k',
            languageBucket: 'python',
        });
        sendArtifactCreatedEvent({
            artifactType: 'document',
            artifactToolMode: 'create',
            artifactPosition: 2,
            contentLengthBucket: '0-1k',
        });
        sendArtifactRevisedEvent({
            artifactType: 'document',
            artifactToolMode: 'revise',
            artifactPosition: 1,
            contentLengthBucket: '0-1k',
            revisionSource: 'inline-edit',
            versionNumber: 2,
        });
        sendArtifactRevisedEvent({
            artifactType: 'document',
            artifactPosition: 1,
            contentLengthBucket: '0-1k',
            revisionSource: 'manual-edit',
            versionNumber: 3,
        });
        sendArtifactPanelOpenedEvent({ source: 'chip', artifactType: 'presentation', artifactPosition: 1 });
        sendArtifactPanelClosedEvent({
            closedDuringLoading: false,
            artifactType: 'presentation',
            openDurationBucket: '1m-5m',
        });
        sendArtifactPanelClosedEvent({ closedDuringLoading: true });
        sendArtifactContentCopiedEvent({ artifactType: 'code', layout: 'fullscreen' });
        sendArtifactDownloadedEvent({
            format: 'pptx',
            artifactType: 'presentation',
            layout: 'docked',
            result: 'error',
        });
        sendArtifactSaveToDriveCompletedEvent({ format: 'md', artifactType: 'document', result: 'success' });
        sendArtifactInlineActionSentEvent({ kind: 'explain', artifactType: 'code', layout: 'mobile' });
        sendArtifactWebpageViewToggledEvent({ mode: 'code', layout: 'docked' });

        expect(sendCustomEvent.mock.calls).toMatchSnapshot();
    });
});
