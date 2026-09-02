/*
 * Usage node extract-sourcemaps.mjs <bundleDir> <outputDir>
 *
 * Recreates the original source tree from the .js.map files of a built bundle,
 * so we can run ttag extract over the code we actually ship (post tree-shaking)
 * instead of over the whole repository.
 *
 * A sourcemap already carries every original file verbatim in `sourcesContent`,
 * so this is only a matter of writing each entry to the path listed in the
 * matching `sources` slot - no mappings need to be decoded.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { glob } from 'glob';
import path from 'node:path';

// Writing the sources is I/O bound and a bundle holds thousands of tiny files,
// so we keep a batch of writes in flight instead of awaiting them one by one.
const WRITE_CONCURRENCY = 64;

/**
 * @typedef {{ version:number, sources:string[], sourcesContent:(string|null)[] }} SourceMap
 */

/**
 * Resolve where a source of a sourcemap lands on disk.
 * `sources` is untrusted input: we normalise separators and anchor to '/' so a
 * `../` cannot climb out (those are common in webpack bundles), then assert the
 * result is really inside `outputDir` before handing the path to fs.
 * @param {string} outputDir
 * @param {string} source value from the sourcemap `sources` array
 * @return {string | null} null when the source cannot be safely mapped
 */
function resolveSourcePath(outputDir, source) {
    if (typeof source !== 'string') {
        return null;
    }

    // `outputDir` is this script's own CLI argument (`i18n-js` from extract.sh),
    // not remote or user-supplied input.
    // nosemgrep
    const root = path.resolve(outputDir);
    // A backslash is a separator on win32, so normalise before anchoring
    const relative = path.posix.join('/', source.replace(/\\/g, '/')).slice(1);

    if (!relative) {
        return null;
    }

    // `relative` is anchored at '/' so any `../` collapses, and the result is
    // asserted to live under `root` on the next lines.
    // nosemgrep
    const destination = path.resolve(root, relative);

    if (!destination.startsWith(root + path.sep)) {
        return null;
    }

    return destination;
}

/**
 * Write a batch of sources, creating their directories as we go.
 * @param {string} outputDir
 * @param {SourceMap} sourceMap
 * @return {Promise<number>} how many files we wrote
 */
async function writeSources(outputDir, { sources, sourcesContent }) {
    const entries = sources
        .map((source, index) => ({ source, content: sourcesContent[index] }))
        // webpack leaves the content out for sources it does not own, e.g. some
        // vendor chunks. There is nothing to extract from those.
        .filter(({ content }) => typeof content === 'string');

    let written = 0;

    for (let i = 0; i < entries.length; i += WRITE_CONCURRENCY) {
        const batch = entries.slice(i, i + WRITE_CONCURRENCY);
        await Promise.all(
            batch.map(async ({ source, content }) => {
                const destination = resolveSourcePath(outputDir, source);

                if (!destination) {
                    console.warn(`[!] skipping unmappable source path: ${source}`);
                    return;
                }

                // Skip the odd entry rather than abandoning the rest of the map:
                // a path collision or an EACCES on one source should not cost us
                // every source that comes after it.
                try {
                    await mkdir(path.dirname(destination), { recursive: true });
                    await writeFile(destination, content);
                    written++;
                } catch (e) {
                    console.warn(`[!] ${source}: ${e.message}`);
                }
            })
        );
    }

    return written;
}

/**
 * @param {string} file path to a .js.map
 * @param {string} outputDir
 * @return {Promise<number>} how many files we wrote
 */
async function extractSourceMap(file, outputDir) {
    /** @type {SourceMap} */
    const sourceMap = JSON.parse(await readFile(file, 'utf8'));

    if (sourceMap.version !== 3) {
        console.warn(`[!] ${file}: sourcemap version ${sourceMap.version}, only 3 is tested`);
    }

    if (!sourceMap.sources?.length || !sourceMap.sourcesContent?.length) {
        console.warn(`[!] ${file}: no sources to extract`);
        return 0;
    }

    const written = await writeSources(outputDir, sourceMap);
    console.log(`[+] ${file}: ${written}/${sourceMap.sources.length} sources`);

    return written;
}

async function main([bundleDir, outputDir]) {
    if (!bundleDir || !outputDir) {
        console.error('Usage node extract-sourcemaps.mjs <bundleDir> <outputDir>');
        process.exit(1);
    }

    const files = await glob('**/*.js.map', { cwd: bundleDir, absolute: true });

    if (!files.length) {
        throw new Error(`No .js.map found in ${bundleDir}, was the bundle built with sourcemaps?`);
    }

    let total = 0;
    const failures = [];

    // Parsing is synchronous and a main bundle map can weigh tens of MB, so we
    // take the maps one at a time to keep the peak heap flat. The CI runners
    // cap us at --max-old-space-size=3000.
    for (const file of files) {
        try {
            total += await extractSourceMap(file, outputDir);
        } catch (e) {
            failures.push(file);
            console.warn(`[!] ${file}: ${e.message}`);
        }
    }

    // A partial failure is survivable, an empty output is not: ttag extract
    // would happily write an empty template and wipe every translation.
    if (!total) {
        throw new Error(`Extracted no sources from ${files.length} sourcemap(s) in ${bundleDir}`);
    }

    console.log(`[+] done, ${total} sources from ${files.length - failures.length}/${files.length} sourcemap(s)`);
}

main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
});
