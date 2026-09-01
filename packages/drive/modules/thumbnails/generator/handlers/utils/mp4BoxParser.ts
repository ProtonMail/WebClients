/**
 * Minimal ISO BMFF (MP4/MOV) box parser for duration + dimensions, and for
 * the movie-level creation time.
 *
 * Chrome's `<video>` element reports `duration: Infinity` for fragmented MP4
 * (`moov`'s `mvhd`/`mdhd` duration is 0, no sample table) because it never
 * gets a full demux to compute it from. At upload time we already hold the
 * whole file, so we read the same boxes a demuxer would: `tkhd` for
 * dimensions, and `mvhd`/`mdhd` duration when present, falling back to the
 * last fragment's `tfdt` + sample durations when it isn't.
 *
 * `<video>`/`File` also expose no capture date for videos (unlike images,
 * which carry it in EXIF), so we read `moov`'s `mvhd.creation_time` directly
 * — the only place a video's original recording time survives re-export
 * (e.g. through Google Takeout).
 *
 * Only handles the boxes needed for that: returns `null` (never throws) for
 * anything else, including non-ISO-BMFF containers (WebM/MKV/AVI).
 */

// Seconds between the MP4/QuickTime epoch (1904-01-01) and the Unix epoch (1970-01-01).
const MAC_EPOCH_OFFSET_SECONDS = 2082844800;

export interface Mp4Metadata {
    durationInSeconds: number;
    width: number;
    height: number;
}

interface BoxRange {
    type: string;
    bodyStart: number;
    bodyEnd: number;
}

/**
 * Whether a buffer's first box is `ftyp` — the ISO-BMFF (MP4/MOV) file-type box, always first per spec.
 *
 * Used to recover from a wrong container guess: a file can be named e.g. `.avi` while actually holding
 * an MP4 container (this happens with Google Takeout exports), which makes extension-based MIME
 * detection report `video/x-msvideo` even though the bytes are playable as `video/mp4`.
 */
export function isIsoBmffContainer(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 8) {
        return false;
    }
    try {
        return readBoxType(new DataView(buffer), 4) === 'ftyp';
    } catch {
        return false;
    }
}

function readBoxType(view: DataView, offset: number): string {
    return String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
    );
}

/** Sibling boxes within [start, end); never throws on malformed sizes, just stops. */
function boxesIn(view: DataView, start: number, end: number): BoxRange[] {
    const boxes: BoxRange[] = [];
    let offset = start;
    while (offset + 8 <= end) {
        let size = view.getUint32(offset);
        const type = readBoxType(view, offset + 4);
        let bodyStart = offset + 8;
        if (size === 1) {
            if (offset + 16 > end) {
                break;
            }
            size = view.getUint32(offset + 8) * 2 ** 32 + view.getUint32(offset + 12);
            bodyStart = offset + 16;
        } else if (size === 0) {
            size = end - offset; // Box extends to the end of its parent (last box only)
        }
        if (size < 8 || offset + size > end) {
            break;
        }
        boxes.push({ type, bodyStart, bodyEnd: offset + size });
        offset += size;
    }
    return boxes;
}

function findBox(boxes: BoxRange[], type: string): BoxRange | undefined {
    return boxes.find((box) => box.type === type);
}

function parseTkhd(view: DataView, box: BoxRange): { trackId: number; width: number; height: number } {
    const version = view.getUint8(box.bodyStart);
    const trackId = view.getUint32(box.bodyStart + (version === 1 ? 20 : 12));
    const fieldsOffset = box.bodyStart + (version === 1 ? 88 : 76);
    return {
        trackId,
        width: view.getUint32(fieldsOffset) / 65536, // 16.16 fixed point
        height: view.getUint32(fieldsOffset + 4) / 65536,
    };
}

/** Shared layout of `mvhd` and `mdhd`: version/flags, then creation/modification time, timescale, duration. */
function parseTimescaleAndDuration(view: DataView, box: BoxRange): { timescale: number; duration: number } {
    const version = view.getUint8(box.bodyStart);
    if (version === 1) {
        const timescale = view.getUint32(box.bodyStart + 20);
        const high = view.getUint32(box.bodyStart + 24);
        const low = view.getUint32(box.bodyStart + 28);
        return { timescale, duration: high * 2 ** 32 + low };
    }
    return { timescale: view.getUint32(box.bodyStart + 12), duration: view.getUint32(box.bodyStart + 16) };
}

/** `creation_time` field of `mvhd`/`mdhd`, converted from the MP4 epoch to a JS `Date`. */
function parseCreationTime(view: DataView, box: BoxRange): Date | null {
    const version = view.getUint8(box.bodyStart);
    const macEpochSeconds =
        version === 1
            ? view.getUint32(box.bodyStart + 4) * 2 ** 32 + view.getUint32(box.bodyStart + 8)
            : view.getUint32(box.bodyStart + 4);
    const unixSeconds = macEpochSeconds - MAC_EPOCH_OFFSET_SECONDS;
    return unixSeconds > 0 ? new Date(unixSeconds * 1000) : null;
}

function parseTfhd(view: DataView, box: BoxRange): { trackId: number; defaultSampleDuration?: number } {
    const flags = view.getUint32(box.bodyStart) & 0x00ffffff;
    const trackId = view.getUint32(box.bodyStart + 4);
    let offset = box.bodyStart + 8;
    if (flags & 0x000001) {
        offset += 8; // base_data_offset
    }
    if (flags & 0x000002) {
        offset += 4; // sample_description_index
    }
    if (flags & 0x000008) {
        return { trackId, defaultSampleDuration: view.getUint32(offset) };
    }
    return { trackId };
}

function parseTfdt(view: DataView, box: BoxRange): number {
    const version = view.getUint8(box.bodyStart);
    if (version === 1) {
        const high = view.getUint32(box.bodyStart + 4);
        const low = view.getUint32(box.bodyStart + 8);
        return high * 2 ** 32 + low;
    }
    return view.getUint32(box.bodyStart + 4);
}

/** Sum of this `trun`'s sample durations, from per-sample values or the track's default. */
function sumTrunDuration(view: DataView, box: BoxRange, defaultSampleDuration: number | undefined): number {
    const flags = view.getUint32(box.bodyStart) & 0x00ffffff;
    const sampleCount = view.getUint32(box.bodyStart + 4);
    let offset = box.bodyStart + 8;
    if (flags & 0x000001) {
        offset += 4; // data_offset
    }
    if (flags & 0x000004) {
        offset += 4; // first_sample_flags
    }

    const hasSampleDuration = (flags & 0x000100) !== 0;
    if (!hasSampleDuration) {
        return sampleCount * (defaultSampleDuration ?? 0);
    }

    const fieldsPerSample = 1 + (flags & 0x000200 ? 1 : 0) + (flags & 0x000400 ? 1 : 0) + (flags & 0x000800 ? 1 : 0);
    let total = 0;
    for (let i = 0; i < sampleCount; i++) {
        total += view.getUint32(offset);
        offset += fieldsPerSample * 4;
    }
    return total;
}

/** Latest `tfdt` + sample durations across every fragment's `traf` for this track. */
function fragmentedDurationTicks(view: DataView, topLevel: BoxRange[], trackId: number): number {
    let maxEnd = 0;
    for (const moof of topLevel.filter((box) => box.type === 'moof')) {
        for (const traf of boxesIn(view, moof.bodyStart, moof.bodyEnd).filter((box) => box.type === 'traf')) {
            const trafBoxes = boxesIn(view, traf.bodyStart, traf.bodyEnd);
            const tfhdBox = findBox(trafBoxes, 'tfhd');
            const tfdtBox = findBox(trafBoxes, 'tfdt');
            if (!tfhdBox || !tfdtBox) {
                continue;
            }
            const { trackId: trafTrackId, defaultSampleDuration } = parseTfhd(view, tfhdBox);
            if (trafTrackId !== trackId) {
                continue;
            }
            let end = parseTfdt(view, tfdtBox);
            for (const trunBox of trafBoxes.filter((box) => box.type === 'trun')) {
                end += sumTrunDuration(view, trunBox, defaultSampleDuration);
            }
            maxEnd = Math.max(maxEnd, end);
        }
    }
    return maxEnd;
}

// A box header is 8 bytes, or 16 when the size field signals a 64-bit size.
const BOX_HEADER_BYTES = 16;
// `mvhd` is ~120 bytes and the spec puts it first in `moov`, ahead of the `trak` boxes.
const MOOV_HEAD_BYTES = 1024;
// Real files have a handful of top-level boxes. The cap only stops a corrupt file from turning
// the walk into millions of reads.
const MAX_TOP_LEVEL_BOXES = 64;

/**
 * Movie-level capture date from `moov`'s `mvhd` box, or `null` if absent/unparseable.
 *
 * Reads only the boxes it needs — the top-level headers to locate `moov`, then the start of
 * `moov` itself — rather than the whole file, which for a phone recording is several GB.
 * `moov` can be at either end: camera recorders write it last, since its size isn't known
 * until recording stops.
 */
export async function readMp4CreationTime(file: Blob): Promise<Date | null> {
    try {
        let offset = 0;
        for (let index = 0; index < MAX_TOP_LEVEL_BOXES && offset + 8 <= file.size; index++) {
            const header = new DataView(await file.slice(offset, offset + BOX_HEADER_BYTES).arrayBuffer());
            let size = header.getUint32(0);
            let bodyStart = offset + 8;
            if (size === 1) {
                if (header.byteLength < 16) {
                    return null;
                }
                size = header.getUint32(8) * 2 ** 32 + header.getUint32(12);
                bodyStart = offset + 16;
            } else if (size === 0) {
                size = file.size - offset; // Box extends to the end of the file (last box only)
            }
            if (size < 8) {
                return null;
            }
            if (readBoxType(header, 4) === 'moov') {
                const bodyEnd = Math.min(bodyStart + MOOV_HEAD_BYTES, offset + size);
                const body = await file.slice(bodyStart, bodyEnd).arrayBuffer();
                const view = new DataView(body);
                const mvhd = findBox(boxesIn(view, 0, body.byteLength), 'mvhd');
                return mvhd ? parseCreationTime(view, mvhd) : null;
            }
            offset += size;
        }
        return null;
    } catch {
        return null;
    }
}

export function parseMp4Metadata(buffer: ArrayBuffer): Mp4Metadata | null {
    try {
        const view = new DataView(buffer);
        const topLevel = boxesIn(view, 0, buffer.byteLength);

        const moov = findBox(topLevel, 'moov');
        if (!moov) {
            return null;
        }

        let track: { trackId: number; width: number; height: number; timescale: number; duration: number } | undefined;
        for (const trak of boxesIn(view, moov.bodyStart, moov.bodyEnd).filter((box) => box.type === 'trak')) {
            const trakBoxes = boxesIn(view, trak.bodyStart, trak.bodyEnd);
            const tkhdBox = findBox(trakBoxes, 'tkhd');
            const mdiaBox = findBox(trakBoxes, 'mdia');
            if (!tkhdBox || !mdiaBox) {
                continue;
            }
            const { trackId, width, height } = parseTkhd(view, tkhdBox);
            if (!width || !height) {
                continue; // Not the video track (audio/metadata tracks have no width/height)
            }
            const mdhdBox = findBox(boxesIn(view, mdiaBox.bodyStart, mdiaBox.bodyEnd), 'mdhd');
            if (!mdhdBox) {
                continue;
            }
            const { timescale, duration } = parseTimescaleAndDuration(view, mdhdBox);
            track = { trackId, width, height, timescale, duration };
            break;
        }
        if (!track || !track.timescale) {
            return null;
        }

        const durationTicks = track.duration || fragmentedDurationTicks(view, topLevel, track.trackId);
        if (!durationTicks) {
            return null;
        }

        return { width: track.width, height: track.height, durationInSeconds: durationTicks / track.timescale };
    } catch {
        return null;
    }
}
