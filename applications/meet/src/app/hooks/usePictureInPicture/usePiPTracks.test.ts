import { renderHook } from '@testing-library/react';
import { type Participant, Track } from 'livekit-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MeetState } from '@proton/meet/store/rootReducer';

import type { PiPTile } from './types';
import { usePiPTracks } from './usePiPTracks';

const livekitMocks = vi.hoisted(() => ({
    useTracks: vi.fn(),
}));
vi.mock('@livekit/components-react', () => livekitMocks);

let selfView = true;
vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: (state: MeetState) => unknown) =>
        selector({ meetSettings: { selfView } } as unknown as MeetState),
}));

vi.mock('../useParticipantDisplayColors', () => ({
    useParticipantDisplayColors: (identity?: string) => ({
        participantColors: {
            backgroundColor: `meet-background-${identity}`,
            profileColor: `profile-background-${identity}`,
        },
    }),
}));

const createParticipant = (identity: string, isLocal: boolean) => ({ identity, isLocal }) as unknown as Participant;

const createTrackRef = (participant: Participant, source: Track.Source, trackSid: string, isMuted = false) => ({
    participant,
    source,
    publication: {
        source,
        trackSid,
        track: { sid: trackSid },
        isMuted,
        isSubscribed: true,
        isEnabled: true,
    },
});

const localParticipant = createParticipant('local', true);
const remoteParticipant = createParticipant('remote', false);
const sortedParticipants = [localParticipant, remoteParticipant];

const localCamera = createTrackRef(localParticipant, Track.Source.Camera, 'local-camera');
const mutedLocalCamera = createTrackRef(localParticipant, Track.Source.Camera, 'local-camera', true);
const remoteCamera = createTrackRef(remoteParticipant, Track.Source.Camera, 'remote-camera');
const localScreenShare = createTrackRef(localParticipant, Track.Source.ScreenShare, 'local-screen');
const remoteScreenShare = createTrackRef(remoteParticipant, Track.Source.ScreenShare, 'remote-screen');

let screenShareTracks: unknown[] = [];
let cameraTracks: unknown[] = [];

const renderPiPTracks = (participants = sortedParticipants) => renderHook(() => usePiPTracks(participants));

const describeTiles = (tiles: PiPTile[]) =>
    tiles.map((tile) =>
        tile.kind === 'placeholder' ? `placeholder:${tile.participant.identity}` : tile.publication.trackSid
    );

describe('usePiPTracks', () => {
    beforeEach(() => {
        selfView = true;
        screenShareTracks = [];
        cameraTracks = [localCamera, remoteCamera];
        livekitMocks.useTracks.mockImplementation(([source]: Track.Source[]) =>
            source === Track.Source.ScreenShare ? screenShareTracks : cameraTracks
        );
    });

    const createRemoteCameras = (identities: string[]) => {
        const participants = identities.map((identity) => createParticipant(identity, false));
        const tracks = participants.map((participant) =>
            createTrackRef(participant, Track.Source.Camera, `${participant.identity}-camera`)
        );
        return { participants, tracks };
    };

    it('shows the presenter camera first, then the other cameras, without their own screen share', () => {
        screenShareTracks = [localScreenShare];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual(['local-camera', 'remote-camera']);
        expect(result.current.tracksKey).not.toContain('local-screen');
    });

    it('shows the local placeholder tile in their colors first when their camera is off', () => {
        screenShareTracks = [localScreenShare];
        cameraTracks = [mutedLocalCamera, remoteCamera];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual(['placeholder:local', 'remote-camera']);
        expect(result.current.tilesForDisplay[0]).toMatchObject({
            backgroundColorClassName: 'meet-background-local',
            profileColorClassName: 'profile-background-local',
        });
    });

    it('shows the local placeholder tile alone when the presenter is alone with their camera off', () => {
        screenShareTracks = [localScreenShare];
        cameraTracks = [];

        const { result } = renderPiPTracks([localParticipant]);

        expect(describeTiles(result.current.tilesForDisplay)).toEqual(['placeholder:local']);
    });

    it('shows the local tile first when nobody shares and a slot is free', () => {
        cameraTracks = [mutedLocalCamera, remoteCamera];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual(['placeholder:local', 'remote-camera']);
    });

    it('gives the local tile the top slot when three other cameras leave one free', () => {
        const others = createRemoteCameras(['remote-2', 'remote-3']);
        cameraTracks = [mutedLocalCamera, remoteCamera, ...others.tracks];

        const { result } = renderPiPTracks([localParticipant, remoteParticipant, ...others.participants]);

        expect(describeTiles(result.current.tilesForDisplay)).toEqual([
            'placeholder:local',
            'remote-camera',
            'remote-2-camera',
            'remote-3-camera',
        ]);
    });

    it('leaves the local tile out when four other cameras fill the slots', () => {
        const others = createRemoteCameras(['remote-2', 'remote-3', 'remote-4']);
        cameraTracks = [localCamera, remoteCamera, ...others.tracks];

        const { result } = renderPiPTracks([localParticipant, remoteParticipant, ...others.participants]);

        expect(describeTiles(result.current.tilesForDisplay)).toEqual([
            'remote-camera',
            'remote-2-camera',
            'remote-3-camera',
            'remote-4-camera',
        ]);
    });

    it('leaves the local tile out when a remote screen share and three other cameras fill the slots', () => {
        const others = createRemoteCameras(['remote-2', 'remote-3']);
        screenShareTracks = [remoteScreenShare];
        cameraTracks = [localCamera, remoteCamera, ...others.tracks];

        const { result } = renderPiPTracks([localParticipant, remoteParticipant, ...others.participants]);

        expect(describeTiles(result.current.tilesForDisplay)).toEqual([
            'remote-screen',
            'remote-camera',
            'remote-2-camera',
            'remote-3-camera',
        ]);
    });

    it('shows the local tile first, then the remote screen share, then the other cameras', () => {
        screenShareTracks = [remoteScreenShare];
        cameraTracks = [mutedLocalCamera, remoteCamera];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual([
            'placeholder:local',
            'remote-screen',
            'remote-camera',
        ]);
        expect(result.current.tilesForDisplay[1]).toMatchObject({ kind: 'track', isScreenShare: true });
    });

    it('shows the remote screen share, not the presenter own one, when both share', () => {
        screenShareTracks = [localScreenShare, remoteScreenShare];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual([
            'local-camera',
            'remote-screen',
            'remote-camera',
        ]);
        expect(result.current.tracksKey).not.toContain('local-screen');
    });

    it('leaves the local tile out with self view off when other tiles are shown', () => {
        selfView = false;
        screenShareTracks = [localScreenShare];
        cameraTracks = [mutedLocalCamera, remoteCamera];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual(['remote-camera']);
    });

    it('keeps the local tile with self view off when it is the only tile', () => {
        selfView = false;
        screenShareTracks = [localScreenShare];
        cameraTracks = [mutedLocalCamera];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual(['placeholder:local']);
    });

    it('keeps the local tile with self view off when the other tiles cannot be drawn yet', () => {
        selfView = false;
        screenShareTracks = [
            localScreenShare,
            { ...remoteScreenShare, publication: { ...remoteScreenShare.publication, track: undefined } },
        ];
        cameraTracks = [mutedLocalCamera];

        const { result } = renderPiPTracks();

        expect(describeTiles(result.current.tilesForDisplay)).toEqual(['placeholder:local', 'remote-screen']);
    });

    it('changes the tracks key when the local participant turns their camera off', () => {
        screenShareTracks = [localScreenShare];
        const { result, rerender } = renderPiPTracks();
        const cameraOnKey = result.current.tracksKey;

        cameraTracks = [mutedLocalCamera, remoteCamera];
        rerender();

        expect(result.current.tracksKey).not.toBe(cameraOnKey);
    });
});
