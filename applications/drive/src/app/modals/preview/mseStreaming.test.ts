import {
    isFragmentedMp4,
    offsetForTime,
    parseTfraEntries,
    readMfroMfraSize,
    readTimescale,
    sniffCodecs,
} from './mseStreaming';

function concat(...buffers: Uint8Array<ArrayBuffer>[]): Uint8Array<ArrayBuffer> {
    const total = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const buffer of buffers) {
        result.set(buffer, offset);
        offset += buffer.byteLength;
    }
    return result;
}

function bytes(...values: number[]): Uint8Array<ArrayBuffer> {
    return new Uint8Array(values);
}

/** ISO BMFF box: 4-byte size, 4-byte type, then body. */
function box(type: string, body: Uint8Array<ArrayBuffer> = new Uint8Array(0)): Uint8Array<ArrayBuffer> {
    const size = 8 + body.byteLength;
    const header = new Uint8Array(8);
    new DataView(header.buffer).setUint32(0, size);
    for (let i = 0; i < 4; i++) {
        header[4 + i] = type.charCodeAt(i);
    }
    return concat(header, body);
}

const ftyp = box('ftyp', new Uint8Array(new TextEncoder().encode('isom')));

/** avcC body: configurationVersion, profile, profile_compatibility, level, ... */
function avcC(profile: number, compatibility: number, level: number): Uint8Array<ArrayBuffer> {
    return box('avcC', concat(bytes(1, profile, compatibility, level), new Uint8Array(4)));
}

/** 4-byte big-endian unsigned int. */
function u32(value: number): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, value);
    return out;
}

/** 8-byte big-endian unsigned int. */
function u64(value: number): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(8);
    new DataView(out.buffer).setBigUint64(0, BigInt(value));
    return out;
}

const verFlags = (version: number) => bytes(version, 0, 0, 0);

/** mdhd box carrying a timescale, in the given box version's layout. */
function mdhd(timescale: number, version: 0 | 1 = 0): Uint8Array<ArrayBuffer> {
    const timestamps = version === 1 ? new Uint8Array(16) : new Uint8Array(8);
    const duration = version === 1 ? u64(0) : u32(0);
    return box('mdhd', concat(verFlags(version), timestamps, u32(timescale), duration));
}

/** mfro trailer box carrying the total size of the mfra index. */
function mfro(mfraSize: number): Uint8Array<ArrayBuffer> {
    return box('mfro', concat(verFlags(0), u32(mfraSize)));
}

/**
 * tfra box for track 1 with the given (time, offset) entries. The traf/trun/
 * sample numbers are each one byte (lengths field 0), which we don't read.
 */
function tfra(entries: { time: number; offset: number }[], version: 0 | 1 = 1): Uint8Array<ArrayBuffer> {
    const parts: Uint8Array<ArrayBuffer>[] = [verFlags(version), u32(1), u32(0), u32(entries.length)];
    for (const entry of entries) {
        parts.push(version === 1 ? u64(entry.time) : u32(entry.time));
        parts.push(version === 1 ? u64(entry.offset) : u32(entry.offset));
        parts.push(bytes(1), bytes(1), bytes(1));
    }
    return box('tfra', concat(...parts));
}

describe('isFragmentedMp4', () => {
    test('detects a fragmented file by its moof box', () => {
        const head = concat(ftyp, box('moov', box('mvex')), box('moof'), box('mdat'));

        expect(isFragmentedMp4(head)).toBe(true);
    });

    test('detects a fragmented file by mvex inside moov even before the first moof', () => {
        const head = concat(ftyp, box('moov', concat(box('mvex'), box('trak'))));

        expect(isFragmentedMp4(head)).toBe(true);
    });

    test('returns false for a progressive file (moov + mdat, no moof/mvex)', () => {
        const head = concat(ftyp, box('moov', box('trak')), box('mdat', new Uint8Array(16)));

        expect(isFragmentedMp4(head)).toBe(false);
    });

    test('returns false for a non-MP4 head', () => {
        const head = bytes(0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02, 0x03, 0x04);

        expect(isFragmentedMp4(head)).toBe(false);
    });
});

describe('sniffCodecs', () => {
    test('builds an avc1 codec string from the avcC profile/compatibility/level', () => {
        // High profile (0x64), no constraints (0x00), level 4.0 (0x28) => avc1.640028
        const head = concat(ftyp, box('moov', avcC(0x64, 0x00, 0x28)));

        expect(sniffCodecs(head)).toBe('avc1.640028');
    });

    test('combines the video and audio codecs when mp4a is present', () => {
        const head = concat(ftyp, box('moov', concat(avcC(0x42, 0xc0, 0x1e), box('mp4a'))));

        expect(sniffCodecs(head)).toBe('avc1.42c01e,mp4a.40.2');
    });

    test('reports HEVC generically when only hvcC is present', () => {
        const head = concat(ftyp, box('moov', box('hvcC', new Uint8Array(8))));

        expect(sniffCodecs(head)).toBe('hvc1.1.6.L93.B0');
    });

    test('reports opus audio when no mp4a is present', () => {
        const head = concat(ftyp, box('moov', concat(avcC(0x64, 0x00, 0x1f), box('Opus'))));

        expect(sniffCodecs(head)).toBe('avc1.64001f,opus');
    });

    test('returns an empty string when no recognised codec box is present', () => {
        const head = concat(ftyp, box('moov', box('trak')));

        expect(sniffCodecs(head)).toBe('');
    });
});

describe('readTimescale', () => {
    test('reads the timescale from a version 0 mdhd', () => {
        const init = concat(ftyp, box('moov', box('trak', box('mdia', mdhd(90000, 0)))));

        expect(readTimescale(init)).toBe(90000);
    });

    test('reads the timescale from a version 1 mdhd', () => {
        const init = concat(ftyp, box('moov', box('trak', box('mdia', mdhd(48000, 1)))));

        expect(readTimescale(init)).toBe(48000);
    });

    test('returns undefined when there is no mdhd', () => {
        const init = concat(ftyp, box('moov', box('trak')));

        expect(readTimescale(init)).toBeUndefined();
    });
});

describe('readMfroMfraSize', () => {
    test('reads the mfra size from the mfro trailer at the end', () => {
        const tail = concat(box('mdat', new Uint8Array(8)), mfro(32972));

        expect(readMfroMfraSize(tail)).toBe(32972);
    });

    test('returns undefined when there is no mfro trailer', () => {
        const tail = concat(box('mdat', new Uint8Array(16)));

        expect(readMfroMfraSize(tail)).toBeUndefined();
    });

    test('returns undefined for a zero mfra size', () => {
        expect(readMfroMfraSize(mfro(0))).toBeUndefined();
    });
});

describe('parseTfraEntries', () => {
    test('reads version 1 (64-bit) time/offset entries and converts time to seconds', () => {
        // 90000 units at 90000/s => 1 second per step.
        const mfra = tfra([
            { time: 0, offset: 1137 },
            { time: 90000, offset: 231376 },
            { time: 180000, offset: 400000 },
        ]);

        expect(parseTfraEntries(mfra, 90000)).toEqual([
            { time: 0, offset: 1137 },
            { time: 1, offset: 231376 },
            { time: 2, offset: 400000 },
        ]);
    });

    test('reads version 0 (32-bit) entries', () => {
        const mfra = tfra([{ time: 45000, offset: 500 }], 0);

        expect(parseTfraEntries(mfra, 90000)).toEqual([{ time: 0.5, offset: 500 }]);
    });

    test('finds the tfra even when it is wrapped in an mfra with a trailing mfro', () => {
        const entries = [{ time: 90000, offset: 1000 }];
        const mfra = box('mfra', concat(tfra(entries), mfro(0)));

        expect(parseTfraEntries(mfra, 90000)).toEqual([{ time: 1, offset: 1000 }]);
    });

    test('returns an empty list when there is no tfra', () => {
        expect(parseTfraEntries(box('mfra', new Uint8Array(0)), 90000)).toEqual([]);
    });

    test('returns an empty list for a non-positive timescale', () => {
        expect(parseTfraEntries(tfra([{ time: 0, offset: 0 }]), 0)).toEqual([]);
    });
});

describe('offsetForTime', () => {
    const entries = [
        { time: 0, offset: 100 },
        { time: 10, offset: 200 },
        { time: 20, offset: 300 },
        { time: 30, offset: 400 },
    ];

    test('returns the offset of the fragment at or before the time', () => {
        expect(offsetForTime(entries, 15)).toBe(200);
    });

    test('matches exactly on a fragment boundary', () => {
        expect(offsetForTime(entries, 20)).toBe(300);
    });

    test('returns the first offset when the time is before every fragment', () => {
        expect(offsetForTime(entries, -5)).toBe(100);
    });

    test('returns the last offset when the time is past every fragment', () => {
        expect(offsetForTime(entries, 999)).toBe(400);
    });

    test('returns 0 for an empty index', () => {
        expect(offsetForTime([], 10)).toBe(0);
    });
});
