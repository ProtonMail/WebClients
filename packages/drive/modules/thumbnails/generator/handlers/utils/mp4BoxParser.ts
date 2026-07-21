/**
 * Minimal ISO BMFF (MP4/MOV) box parser for duration + dimensions.
 *
 * Chrome's `<video>` element reports `duration: Infinity` for fragmented MP4
 * (`moov`'s `mvhd`/`mdhd` duration is 0, no sample table) because it never
 * gets a full demux to compute it from. At upload time we already hold the
 * whole file, so we read the same boxes a demuxer would: `tkhd` for
 * dimensions, and `mvhd`/`mdhd` duration when present, falling back to the
 * last fragment's `tfdt` + sample durations when it isn't.
 *
 * Only handles the boxes needed for that: returns `null` (never throws) for
 * anything else, including non-ISO-BMFF containers (WebM/MKV/AVI).
 */

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
