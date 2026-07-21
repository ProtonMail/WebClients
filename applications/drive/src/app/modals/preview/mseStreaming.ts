import type { SeekableReadableStream } from '@proton/drive';
import { logging } from '@proton/drive/modules/logging';

const logger = logging.getLogger('preview-mse');

/**
 * Media Source Extensions (MSE) streaming for fragmented MP4 (fMP4).
 *
 * The Service Worker range-server path (see `streaming.ts`) plays progressive
 * MP4 fine, but Chrome's native `<video>` demuxer prescans a fragmented file
 * that carries no top-level index/duration before it will start — so the whole
 * file downloads before playback begins. Such files are typically produced by
 * live/streaming recorders that write out chunks as they go and never rewind to
 * add the index. MSE never prescans: we append the fragments as they arrive and
 * playback starts on the first one.
 *
 * A fragmented MP4 *is* the MSE byte-stream format, so we feed the SDK's
 * decrypt-on-the-fly `SeekableReadableStream` straight into a `SourceBuffer` —
 * no remuxing. Reads are throttled to stay ~`FORWARD_BUFFER_SECONDS` ahead of
 * the playhead so we don't download the whole file, and data well behind the
 * playhead is evicted to stay under the browser's SourceBuffer quota.
 */

const READ_CHUNK_BYTES = 256 * 1024;
const FORWARD_BUFFER_SECONDS = 30;
const BEHIND_BUFFER_SECONDS = 15;
const BACKPRESSURE_POLL_MS = 250;

// The `mfro` trailer at the very end of the file is a fixed 16-byte box; reading
// the last few bytes tells us how big the `mfra` random-access index is.
const MFRO_TAIL_BYTES = 16;

export interface MseStreamHandle {
    url: string;
    dispose: () => void;
    /** Call when the <video> element seeks, so we can fetch the target region. */
    onSeek: () => void;
}

interface StartMseStreamOptions {
    /** Makes a fresh SDK stream; called at the start and again after each read-to-end. */
    createStream: () => SeekableReadableStream;
    /** First bytes of the file, already read for detection — used to sniff codecs. */
    initSegment: Uint8Array<ArrayBuffer>;
    /** Clear-text duration from Drive metadata; fragmented files have none of their own. */
    durationSeconds?: number;
    /** Claimed clear-text file size; used to locate the seek index at the end of the file. */
    totalSize?: number;
    getCurrentTime: () => number;
    shouldStop: () => boolean;
    onError: (error: unknown) => void;
}

/** Index of the first occurrence of a 4-char box type, or -1. */
function findBox(bytes: Uint8Array<ArrayBuffer>, type: string): number {
    const [a, b, c, d] = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)];
    for (let i = 0; i + 4 <= bytes.length; i++) {
        if (bytes[i] === a && bytes[i + 1] === b && bytes[i + 2] === c && bytes[i + 3] === d) {
            return i;
        }
    }
    return -1;
}

/**
 * Fragmented files carry a `moof` fragment box and/or an `mvex` box inside
 * `moov`, both absent from progressive MP4. A false positive only costs a
 * fallback to the Service Worker path, so a byte scan of the head is enough.
 */
export function isFragmentedMp4(head: Uint8Array<ArrayBuffer>): boolean {
    return findBox(head, 'moof') !== -1 || findBox(head, 'mvex') !== -1;
}

const hex = (value: number) => value.toString(16).padStart(2, '0');

/**
 * Builds the `codecs` parameter MSE needs from the init segment. `avcC`/`hvcC`
 * carry the video profile/level; `mp4a`/`Opus` mark the audio track. Anything
 * we can't recognise is left out and `isTypeSupported` decides the rest.
 */
export function sniffCodecs(head: Uint8Array<ArrayBuffer>): string {
    const codecs: string[] = [];

    const avcC = findBox(head, 'avcC');
    if (avcC !== -1) {
        const body = avcC + 4;
        codecs.push(`avc1.${hex(head[body + 1])}${hex(head[body + 2])}${hex(head[body + 3])}`);
    } else if (findBox(head, 'hvcC') !== -1) {
        codecs.push('hvc1.1.6.L93.B0');
    }

    if (findBox(head, 'mp4a') !== -1) {
        codecs.push('mp4a.40.2');
    } else if (findBox(head, 'Opus') !== -1) {
        codecs.push('opus');
    }

    // No space after the comma: Firefox's `isTypeSupported` rejects the
    // space-separated form that Chrome tolerates.
    return codecs.join(',');
}

/** Reads a big-endian 32-bit unsigned int, avoiding sign issues from `<<`. */
function readUint32(bytes: Uint8Array<ArrayBuffer>, pos: number): number {
    return bytes[pos] * 0x1000000 + (bytes[pos + 1] << 16) + (bytes[pos + 2] << 8) + bytes[pos + 3];
}

/** Reads a big-endian 64-bit unsigned int as a JS number (safe up to 2^53). */
function readUint64(bytes: Uint8Array<ArrayBuffer>, pos: number): number {
    return readUint32(bytes, pos) * 0x100000000 + readUint32(bytes, pos + 4);
}

/**
 * Media timescale (units per second) from the init segment's first `mdhd` box —
 * the video track's, since it's the first `trak`. Fragment decode times are
 * expressed in these units, so we need it to turn them into seconds.
 */
export function readTimescale(initSegment: Uint8Array<ArrayBuffer>): number | undefined {
    const type = findBox(initSegment, 'mdhd');
    if (type === -1) {
        return undefined;
    }
    // After the 4-byte type: version (1) + flags (3), then two timestamps whose
    // width depends on the version, then the timescale.
    const version = initSegment[type + 4];
    const timescalePos = version === 1 ? type + 24 : type + 16;
    if (timescalePos + 4 > initSegment.length) {
        return undefined;
    }
    const timescale = readUint32(initSegment, timescalePos);
    return timescale > 0 ? timescale : undefined;
}

/** One fragment in the random-access index: its start time and moof byte offset. */
export interface FragmentIndexEntry {
    time: number;
    offset: number;
}

/**
 * Size of the `mfra` random-access index, read from the `mfro` trailer at the
 * very end of the file, or undefined if there's no `mfro`.
 *
 * `mfro` is a fixed 16-byte box whose last field is the total size of the `mfra`
 * box, so the tail alone tells us how far back to read the whole index.
 */
export function readMfroMfraSize(tail: Uint8Array<ArrayBuffer>): number | undefined {
    const type = findBox(tail, 'mfro');
    if (type === -1) {
        return undefined;
    }
    // After the 4-byte type: version (1) + flags (3), then the 4-byte mfra size.
    const sizePos = type + 8;
    if (sizePos + 4 > tail.length) {
        return undefined;
    }
    const size = readUint32(tail, sizePos);
    return size > 0 ? size : undefined;
}

/**
 * Fragment index built from the first `tfra` box inside an `mfra`. Each entry
 * maps a fragment's start time (seconds) to the byte offset of its `moof` from
 * the start of the file, so a seek can jump straight there instead of scanning.
 *
 * The first `tfra` is the first track's (the video track), which matches the
 * timescale we read from the init segment.
 */
export function parseTfraEntries(mfra: Uint8Array<ArrayBuffer>, timescale: number): FragmentIndexEntry[] {
    const entries: FragmentIndexEntry[] = [];
    if (timescale <= 0) {
        return entries;
    }
    const type = findBox(mfra, 'tfra');
    if (type === -1) {
        return entries;
    }
    const version = mfra[type + 4];
    // After type(4) + version/flags(4) + track_ID(4) comes a packed field whose
    // low bits give the byte widths of the traf/trun/sample numbers we skip over,
    // then the 4-byte entry count. Times and offsets are 64-bit when version is 1.
    const lengths = readUint32(mfra, type + 12);
    const trafSize = ((lengths >> 4) & 0x3) + 1;
    const trunSize = ((lengths >> 2) & 0x3) + 1;
    const sampleSize = (lengths & 0x3) + 1;
    const count = readUint32(mfra, type + 16);
    const valueSize = version === 1 ? 8 : 4;
    const readValue = version === 1 ? readUint64 : readUint32;
    const entryStride = valueSize * 2 + trafSize + trunSize + sampleSize;
    let pos = type + 20;
    for (let i = 0; i < count; i++) {
        if (pos + valueSize * 2 > mfra.length) {
            break;
        }
        const time = readValue(mfra, pos);
        const offset = readValue(mfra, pos + valueSize);
        entries.push({ time: time / timescale, offset });
        pos += entryStride;
    }
    return entries;
}

/** Byte offset of the fragment at or before `time` (the first if none is earlier). */
export function offsetForTime(entries: FragmentIndexEntry[], time: number): number {
    if (!entries.length) {
        return 0;
    }
    let low = 0;
    let high = entries.length - 1;
    let result = entries[0].offset;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (entries[mid].time <= time) {
            result = entries[mid].offset;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return result;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/** Resolves once the pending `appendBuffer`/`remove` operation completes. */
function whenIdle(sourceBuffer: SourceBuffer): Promise<void> {
    if (!sourceBuffer.updating) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        let onEnd: () => void;
        let onErr: () => void;
        const cleanup = () => {
            sourceBuffer.removeEventListener('updateend', onEnd);
            sourceBuffer.removeEventListener('error', onErr);
        };
        onEnd = () => {
            cleanup();
            resolve();
        };
        onErr = () => {
            cleanup();
            reject(new Error('SourceBuffer operation failed'));
        };
        sourceBuffer.addEventListener('updateend', onEnd);
        sourceBuffer.addEventListener('error', onErr);
    });
}

/** Seconds already buffered ahead of the playhead, 0 if the playhead is in a gap. */
function bufferedAhead(sourceBuffer: SourceBuffer, currentTime: number): number {
    const { buffered } = sourceBuffer;
    for (let i = 0; i < buffered.length; i++) {
        if (currentTime >= buffered.start(i) - 0.25 && currentTime <= buffered.end(i)) {
            return buffered.end(i) - currentTime;
        }
    }
    return 0;
}

async function evictBehindPlayhead(sourceBuffer: SourceBuffer, currentTime: number): Promise<void> {
    const { buffered } = sourceBuffer;
    if (!buffered.length) {
        return;
    }
    const removeStart = buffered.start(0);
    const removeEnd = currentTime - BEHIND_BUFFER_SECONDS;
    if (removeEnd <= removeStart) {
        return;
    }
    await whenIdle(sourceBuffer);
    sourceBuffer.remove(removeStart, removeEnd);
    await whenIdle(sourceBuffer);
}

async function appendChunk(
    sourceBuffer: SourceBuffer,
    data: Uint8Array<ArrayBuffer>,
    getCurrentTime: () => number
): Promise<void> {
    await whenIdle(sourceBuffer);
    try {
        sourceBuffer.appendBuffer(data);
        await whenIdle(sourceBuffer);
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            await evictBehindPlayhead(sourceBuffer, getCurrentTime());
            sourceBuffer.appendBuffer(data);
            await whenIdle(sourceBuffer);
            return;
        }
        throw error;
    }
}

export function startMseStream({
    createStream,
    initSegment,
    durationSeconds,
    totalSize,
    getCurrentTime,
    shouldStop,
    onError,
}: StartMseStreamOptions): MseStreamHandle {
    const codecs = sniffCodecs(initSegment);
    const mimeType = `video/mp4; codecs="${codecs}"`;
    if (!codecs || !MediaSource.isTypeSupported(mimeType)) {
        throw new Error(`Unsupported MSE mime type: "${mimeType}"`);
    }

    // Created up front and reassigned when the stream is read to the end and has
    // to be recreated. This helper owns the stream fully.
    let stream = createStream();
    const timescale = readTimescale(initSegment);

    const mediaSource = new MediaSource();
    const url = URL.createObjectURL(mediaSource);
    let disposed = false;
    const stopped = () => disposed || shouldStop();

    // Set by the <video>'s `seeking` event. The pump picks it up and repositions
    // — the ONLY thing that triggers a re-seek, so reaching the end can never be
    // mistaken for a seek.
    let seekRequested = false;

    // The SDK stream closes for good once it's read to the end, so a later read
    // would return nothing. Like the Service Worker path, we make a fresh one on
    // the next seek. A read is always preceded by a seek, so the fresh stream is
    // repositioned before we read from it.
    let streamEnded = false;
    const seekStream = async (position: number) => {
        if (streamEnded) {
            stream = createStream();
            streamEnded = false;
        }
        await stream.seek(position);
    };
    const readStream = async (byteCount: number) => {
        const result = await stream.read(byteCount);
        if (result.done) {
            streamEnded = true;
        }
        return result;
    };

    // The SDK stream gives back exactly `byteCount` bytes (fewer only at the end
    // of the file). Copy into an ArrayBuffer-backed view for the box parsers.
    const readBytes = async (byteCount: number): Promise<Uint8Array<ArrayBuffer>> => {
        const { value } = await readStream(byteCount);
        return value?.byteLength ? new Uint8Array(value) : new Uint8Array(0);
    };

    // Exact time->byte map from the file's `mfra` index, built once on first
    // seek. undefined until we try; empty array if the file has no usable index.
    let fragmentIndex: FragmentIndexEntry[] | undefined;
    const buildFragmentIndex = async () => {
        if (!totalSize || !timescale) {
            return;
        }
        // The `mfra` index lives at the end: read the `mfro` trailer to learn its
        // size, then read the index itself. A tiny tail read, not the whole file.
        await seekStream(Math.max(0, totalSize - MFRO_TAIL_BYTES));
        const tail = await readBytes(MFRO_TAIL_BYTES);
        const mfraSize = readMfroMfraSize(tail);
        if (!mfraSize || mfraSize > totalSize) {
            return;
        }
        await seekStream(totalSize - mfraSize);
        const mfra = await readBytes(mfraSize);
        fragmentIndex = parseTfraEntries(mfra, timescale);
    };

    // Position the stream at the fragment holding `time`. The `mfra` index gives
    // the exact `moof` offset, so we jump straight there. A file with no usable
    // index can't be seeked precisely, so we read from the start (rare — the
    // recorders that make these files add the index).
    const seekStreamToTime = async (time: number) => {
        if (fragmentIndex === undefined) {
            try {
                await buildFragmentIndex();
            } catch (error) {
                logger.warn(`MSE seek: could not read fragment index: ${String(error)}`);
            }
            // Mark as attempted even on failure so we don't retry every seek.
            fragmentIndex = fragmentIndex ?? [];
        }
        if (fragmentIndex.length) {
            await seekStream(offsetForTime(fragmentIndex, time));
            return;
        }
        // TODO: support seeking in fragmented files that have no `mfra` index.
        // We could estimate the byte from a constant bitrate, then read a window
        // and snap to the nearest real fragment using its `moof`/`tfdt` timestamp.
        logger.warn(`MSE seek to ${time.toFixed(1)}s: no index, reading from start`);
        await seekStream(0);
    };

    // Reads the file into the SourceBuffer, staying ~FORWARD_BUFFER_SECONDS ahead
    // of the playhead and evicting well behind it to stay under the browser's
    // buffer quota. It reads front-to-back until the end, then idles. A seek
    // (via `seekRequested`) makes it jump the stream to that time and read
    // forward from there — so seeking doesn't re-read from the start, and idling
    // at the end can't be confused for a seek.
    const pump = async (sourceBuffer: SourceBuffer) => {
        await seekStream(0);
        let atEndOfFile = false;
        while (!stopped()) {
            if (seekRequested) {
                seekRequested = false;
                // Only refetch if the target isn't already well buffered.
                if (bufferedAhead(sourceBuffer, getCurrentTime()) < FORWARD_BUFFER_SECONDS) {
                    await seekStreamToTime(getCurrentTime());
                    // Reset the parser before appending from the new position: a
                    // partial fragment from forward reading is usually still
                    // pending, and a fresh `moof` would corrupt it. `abort()`
                    // needs the source open; after the end it's "ended" with
                    // nothing pending, so appending reopens it and we skip abort.
                    if (mediaSource.readyState === 'open') {
                        await whenIdle(sourceBuffer);
                        if (!stopped()) {
                            sourceBuffer.abort();
                        }
                    }
                    atEndOfFile = false;
                }
                continue;
            }
            if (atEndOfFile || bufferedAhead(sourceBuffer, getCurrentTime()) > FORWARD_BUFFER_SECONDS) {
                await delay(BACKPRESSURE_POLL_MS);
                continue;
            }

            const { value, done } = await readStream(READ_CHUNK_BYTES);
            if (value?.byteLength && !stopped()) {
                // Copy into a fresh ArrayBuffer-backed view: the SDK stream
                // yields a `Uint8Array<ArrayBufferLike>`, which `appendBuffer`
                // (and our typed helpers) don't accept.
                await appendChunk(sourceBuffer, new Uint8Array(value), getCurrentTime);
            }
            if (done) {
                atEndOfFile = true;
                if (!stopped() && mediaSource.readyState === 'open') {
                    mediaSource.endOfStream();
                }
            }
        }
    };

    const onSourceOpen = () => {
        mediaSource.removeEventListener('sourceopen', onSourceOpen);
        if (disposed) {
            return;
        }
        try {
            if (durationSeconds && Number.isFinite(durationSeconds)) {
                mediaSource.duration = durationSeconds;
            }
            const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
            void pump(sourceBuffer).catch((error) => {
                if (!disposed) {
                    onError(error);
                }
            });
        } catch (error) {
            if (!disposed) {
                onError(error);
            }
        }
    };
    mediaSource.addEventListener('sourceopen', onSourceOpen);

    return {
        url,
        dispose: () => {
            disposed = true;
            try {
                if (mediaSource.readyState === 'open') {
                    mediaSource.endOfStream();
                }
            } catch {
                // MediaSource may already be closed; nothing to clean up.
            }
            URL.revokeObjectURL(url);
        },
        onSeek: () => {
            seekRequested = true;
        },
    };
}
