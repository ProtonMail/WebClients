import { parseMp4Metadata, readMp4CreationTime } from './mp4BoxParser';

function concat(...buffers: ArrayBufferLike[]): ArrayBuffer {
    const total = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const buffer of buffers) {
        result.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
    }
    return result.buffer;
}

function u8(value: number): ArrayBuffer {
    return new Uint8Array([value]).buffer;
}

function u16(value: number): ArrayBuffer {
    const buffer = new ArrayBuffer(2);
    new DataView(buffer).setUint16(0, value);
    return buffer;
}

function u32(value: number): ArrayBuffer {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setUint32(0, value);
    return buffer;
}

function zeros(length: number): ArrayBuffer {
    return new ArrayBuffer(length);
}

function box(type: string, ...bodies: ArrayBufferLike[]): ArrayBuffer {
    const body = concat(...bodies);
    const header = new Uint8Array(8);
    new DataView(header.buffer).setUint32(0, 8 + body.byteLength);
    for (let i = 0; i < 4; i++) {
        header[4 + i] = type.charCodeAt(i);
    }
    return concat(header.buffer, body);
}

const IDENTITY_MATRIX = concat(
    u32(0x00010000),
    u32(0),
    u32(0),
    u32(0),
    u32(0x00010000),
    u32(0),
    u32(0),
    u32(0),
    u32(0x40000000)
);

function tkhd(trackId: number, width: number, height: number): ArrayBuffer {
    const body = concat(
        zeros(4), // version + flags (version 0)
        u32(0), // creation_time
        u32(0), // modification_time
        u32(trackId),
        u32(0), // reserved
        u32(0), // duration
        u32(0),
        u32(0), // reserved[2]
        u16(0), // layer
        u16(0), // alternate_group
        u16(0x0100), // volume
        u16(0), // reserved
        IDENTITY_MATRIX,
        u32(width * 65536),
        u32(height * 65536)
    );
    return box('tkhd', body);
}

function tkhdV1(trackId: number, width: number, height: number): ArrayBuffer {
    const body = concat(
        concat(u8(1), zeros(3)), // version 1 + flags
        zeros(8), // creation_time
        zeros(8), // modification_time
        u32(trackId),
        u32(0), // reserved
        zeros(8), // duration
        u32(0),
        u32(0),
        u16(0),
        u16(0),
        u16(0x0100),
        u16(0),
        IDENTITY_MATRIX,
        u32(width * 65536),
        u32(height * 65536)
    );
    return box('tkhd', body);
}

function mdhd(timescale: number, duration: number): ArrayBuffer {
    const body = concat(zeros(4), u32(0), u32(0), u32(timescale), u32(duration));
    return box('mdhd', body);
}

function mdhdV1(timescale: number, duration: number): ArrayBuffer {
    const body = concat(
        concat(u8(1), zeros(3)),
        zeros(8),
        zeros(8),
        u32(timescale),
        u32(Math.floor(duration / 2 ** 32)),
        u32(duration % 2 ** 32)
    );
    return box('mdhd', body);
}

function trak(trackId: number, width: number, height: number, timescale: number, duration: number): ArrayBuffer {
    return box('trak', tkhd(trackId, width, height), box('mdia', mdhd(timescale, duration)));
}

function mvhd(creationTimeMacEpoch: number): ArrayBuffer {
    const body = concat(zeros(4), u32(creationTimeMacEpoch), u32(0), u32(1000), u32(0));
    return box('mvhd', body);
}

function mvhdV1(creationTimeMacEpoch: number): ArrayBuffer {
    const body = concat(
        concat(u8(1), zeros(3)), // version 1 + flags
        u32(0), // creation_time high
        u32(creationTimeMacEpoch), // creation_time low
        zeros(8), // modification_time
        u32(1000), // timescale
        zeros(8) // duration
    );
    return box('mvhd', body);
}

function tfhd(trackId: number, defaultSampleDuration: number): ArrayBuffer {
    const flags = 0x000008; // default-sample-duration-present
    const versionFlags = concat(u8(0), u8((flags >> 16) & 0xff), u8((flags >> 8) & 0xff), u8(flags & 0xff));
    return box('tfhd', concat(versionFlags, u32(trackId), u32(defaultSampleDuration)));
}

function tfdt(baseMediaDecodeTime: number): ArrayBuffer {
    return box('tfdt', concat(zeros(4), u32(baseMediaDecodeTime)));
}

function trunWithDefaultDuration(sampleCount: number): ArrayBuffer {
    return box('trun', concat(zeros(4), u32(sampleCount)));
}

function trunWithSampleDurations(durations: number[]): ArrayBuffer {
    const flags = 0x000100; // sample-duration-present
    const versionFlags = concat(u8(0), u8((flags >> 16) & 0xff), u8((flags >> 8) & 0xff), u8(flags & 0xff));
    return box('trun', concat(versionFlags, u32(durations.length), ...durations.map(u32)));
}

function moof(traf: ArrayBuffer): ArrayBuffer {
    return box('moof', traf);
}

function traf(...boxes: ArrayBuffer[]): ArrayBuffer {
    return box('traf', ...boxes);
}

function mp4File(moovBody: ArrayBuffer, ...trailingTopLevelBoxes: ArrayBuffer[]): ArrayBuffer {
    return concat(
        box('ftyp', new TextEncoder().encode('isom').buffer),
        box('moov', moovBody),
        ...trailingTopLevelBoxes
    );
}

describe('parseMp4Metadata', () => {
    test('reads width, height and duration from a progressive (non-fragmented) file', () => {
        const file = mp4File(trak(1, 1920, 1080, 90000, 2_700_000), box('mdat', zeros(4)));

        expect(parseMp4Metadata(file)).toEqual({ width: 1920, height: 1080, durationInSeconds: 30 });
    });

    test('reads version-1 (64-bit) tkhd/mdhd fields', () => {
        const trakV1 = box('trak', tkhdV1(1, 640, 480), box('mdia', mdhdV1(600, 6000)));
        const file = mp4File(trakV1, box('mdat', zeros(4)));

        expect(parseMp4Metadata(file)).toEqual({ width: 640, height: 480, durationInSeconds: 10 });
    });

    test('falls back to summing fragment durations when mdhd duration is 0 (fragmented MP4)', () => {
        const file = mp4File(
            trak(1, 1280, 720, 1000, 0),
            moof(traf(tfhd(1, 33), tfdt(0), trunWithDefaultDuration(30))),
            box('mdat', zeros(4)),
            moof(traf(tfhd(1, 33), tfdt(990), trunWithDefaultDuration(30))),
            box('mdat', zeros(4))
        );

        expect(parseMp4Metadata(file)).toEqual({ width: 1280, height: 720, durationInSeconds: 1.98 });
    });

    test('sums explicit per-sample durations in trun when present', () => {
        const file = mp4File(
            trak(1, 1280, 720, 1000, 0),
            moof(traf(tfhd(1, 33), tfdt(0), trunWithSampleDurations([100, 200, 300])))
        );

        expect(parseMp4Metadata(file)).toEqual({ width: 1280, height: 720, durationInSeconds: 0.6 });
    });

    test('skips non-video tracks (zero width/height) and picks the video track', () => {
        const audioTrak = trak(1, 0, 0, 44100, 44100);
        const videoTrak = trak(2, 320, 240, 1000, 5000);
        const file = mp4File(concat(audioTrak, videoTrak), box('mdat', zeros(4)));

        expect(parseMp4Metadata(file)).toEqual({ width: 320, height: 240, durationInSeconds: 5 });
    });

    test('returns null when there is no moov box (non-ISO-BMFF container)', () => {
        const webmLikeHeader = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06]).buffer;

        expect(parseMp4Metadata(webmLikeHeader)).toBeNull();
    });

    test('returns null when moov has no usable video track', () => {
        const file = mp4File(box('trak', box('tkhd', zeros(84))));

        expect(parseMp4Metadata(file)).toBeNull();
    });

    test('returns null instead of throwing on a truncated/malformed buffer', () => {
        const truncated = new Uint8Array([0, 0, 0, 20, 0x6d, 0x6f, 0x6f, 0x76, 1, 2, 3]).buffer; // moov claims size 20, buffer is shorter

        expect(parseMp4Metadata(truncated)).toBeNull();
    });
});

describe('readMp4CreationTime', () => {
    // jsdom's Blob has no `arrayBuffer()`, unlike every browser we support.
    beforeAll(() => {
        if (!Blob.prototype.arrayBuffer) {
            Blob.prototype.arrayBuffer = async function () {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as ArrayBuffer);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsArrayBuffer(this);
                });
            };
        }
    });

    // 2009-08-07T17:03:58Z in Unix seconds, offset into the MP4/QuickTime epoch (1904-01-01).
    const MAC_EPOCH_SECONDS = 1249664638 + 2082844800;
    const EXPECTED_DATE = new Date('2009-08-07T17:03:58.000Z');

    test('reads creation_time from mvhd (version 0) and converts from the MP4 epoch to a JS Date', async () => {
        const file = new Blob([mp4File(mvhd(MAC_EPOCH_SECONDS))]);

        await expect(readMp4CreationTime(file)).resolves.toEqual(EXPECTED_DATE);
    });

    test('reads version-1 (64-bit) mvhd creation_time', async () => {
        const file = new Blob([mp4File(mvhdV1(MAC_EPOCH_SECONDS))]);

        await expect(readMp4CreationTime(file)).resolves.toEqual(EXPECTED_DATE);
    });

    test('finds moov when it trails a large mdat, as camera recordings write it', async () => {
        const file = new Blob([
            concat(
                box('ftyp', new TextEncoder().encode('isom').buffer),
                box('mdat', zeros(64 * 1024)),
                box('moov', mvhd(MAC_EPOCH_SECONDS))
            ),
        ]);

        await expect(readMp4CreationTime(file)).resolves.toEqual(EXPECTED_DATE);
    });

    test('reads only the box headers and the start of moov, not the whole file', async () => {
        const file = new Blob([
            concat(
                box('ftyp', new TextEncoder().encode('isom').buffer),
                box('mdat', zeros(64 * 1024)),
                box('moov', mvhd(MAC_EPOCH_SECONDS))
            ),
        ]);
        const bytesRead: number[] = [];
        const slice = file.slice.bind(file);
        jest.spyOn(file, 'slice').mockImplementation((start, end) => {
            const sliced = slice(start, end);
            bytesRead.push(sliced.size);
            return sliced;
        });

        await readMp4CreationTime(file);

        expect(bytesRead.reduce((sum, size) => sum + size, 0)).toBeLessThan(2 * 1024);
    });

    test('returns null when creation_time is zero (unset)', async () => {
        const file = new Blob([mp4File(mvhd(0))]);

        await expect(readMp4CreationTime(file)).resolves.toBeNull();
    });

    test('returns null when there is no mvhd box', async () => {
        const file = new Blob([mp4File(trak(1, 640, 480, 1000, 1000))]);

        await expect(readMp4CreationTime(file)).resolves.toBeNull();
    });

    test('returns null when there is no moov box', async () => {
        const webmLikeHeader = new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0]).buffer]);

        await expect(readMp4CreationTime(webmLikeHeader)).resolves.toBeNull();
    });
});
