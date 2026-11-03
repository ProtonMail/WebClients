/*
 * Usage node extract-parallel.mjs <ttagBin> <output> <file...>
 *
 * Same output as `ttag extract <file...> -o <output>`, in a fraction of the time.
 *
 * babel-plugin-ttag rebuilds and rewrites the whole template after every file,
 * so one `ttag extract` over N files costs O(N²): ~1 min for ~2k files. We split
 * the files into contiguous chunks, extract them concurrently and merge the
 * chunk templates the way the plugin merges entries:
 *   - the first occurrence of a msgctxt/msgid keeps its comments and flags,
 *   - later occurrences only add their references, re-sorted per file and line.
 *
 * Entries are merged as raw text blocks: a parse/compile round trip through
 * gettext-parser trims the comments, so the output would no longer match ttag's.
 */
import gettextParser from 'gettext-parser';
import { globSync } from 'glob';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

/** Small enough to keep the quadratic cost low, large enough to amortise the ~1s ttag startup */
const FILES_PER_CHUNK = 150;
/** Each ttag process peaks at ~400MB, and os.availableParallelism() reports the host's CPUs inside a CI pod */
const DEFAULT_MAX_CONCURRENCY = 4;

const execFileAsync = promisify(execFile);

function getConcurrency() {
    const fromEnv = Number.parseInt(process.env.I18N_EXTRACT_CONCURRENCY ?? '', 10);
    return fromEnv > 0 ? fromEnv : Math.min(os.availableParallelism(), DEFAULT_MAX_CONCURRENCY);
}

/**
 * Same order as ttag-cli, which globs its arguments before walking them. The order
 * decides which occurrence comes first, hence which comments an entry keeps.
 * @param {string[]} files
 */
function resolveFilesInTtagOrder(files) {
    return globSync(files, { absolute: true, nodir: true });
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} size
 * @return {T[][]}
 */
function splitIntoContiguousChunks(items, size) {
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
        items.slice(index * size, (index + 1) * size)
    );
}

/**
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} task
 * @return {Promise<R[]>} results in the order of `items`
 */
async function mapWithConcurrency(items, concurrency, task) {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await task(items[index], index);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return results;
}

/** @see poReferenceComparator in babel-plugin-ttag */
function compareReferences(first, second) {
    if (!/:\d+$/.test(first)) {
        return first < second ? -1 : Number(first > second);
    }
    const firstSeparator = first.lastIndexOf(':');
    const secondSeparator = second.lastIndexOf(':');
    const firstFile = first.substring(0, firstSeparator);
    const secondFile = second.substring(0, secondSeparator);
    if (firstFile !== secondFile) {
        return firstFile < secondFile ? -1 : 1;
    }
    return Number(first.substring(firstSeparator + 1)) - Number(second.substring(secondSeparator + 1));
}

const isReferenceLine = (line) => line.startsWith('#: ');

/**
 * @param {string} block one entry of a template, without the trailing blank line
 */
function parseBlock(block) {
    const { translations } = gettextParser.po.parse(block);
    const [context] = Object.keys(translations).filter((key) => Object.keys(translations[key]).some(Boolean));
    const [msgid] = Object.keys(translations[context]).filter(Boolean);
    const lines = block.split('\n');
    return {
        context,
        msgid,
        lines,
        references: lines.filter(isReferenceLine).map((line) => line.slice(3)),
    };
}

/**
 * @param {string[]} templates chunk templates, in file order
 */
function mergeTemplates(templates) {
    const [header] = templates[0].split('\n\n');
    /** Plain objects on purpose: the plugin keys entries this way, so iteration order matches */
    const entries = { '': {} };

    for (const template of templates) {
        const blocks = template.trimEnd().split('\n\n').slice(1);
        for (const block of blocks) {
            const entry = parseBlock(block);
            entries[entry.context] ??= {};
            const existing = entries[entry.context][entry.msgid];
            if (!existing) {
                entries[entry.context][entry.msgid] = entry;
                continue;
            }
            for (const reference of entry.references) {
                if (!existing.references.includes(reference)) {
                    existing.references.push(reference);
                }
            }
        }
    }

    const blocks = Object.values(entries).flatMap((byMsgid) =>
        Object.values(byMsgid).map(({ lines, references }) => {
            const firstReferenceIndex = lines.findIndex(isReferenceLine);
            const otherLines = lines.filter((line) => !isReferenceLine(line));
            const referenceLines = references.sort(compareReferences).map((reference) => `#: ${reference}`);
            otherLines.splice(firstReferenceIndex, 0, ...referenceLines);
            return otherLines.join('\n');
        })
    );

    return `${[header, ...blocks].join('\n\n')}\n`;
}

async function main([ttagBin, output, ...files]) {
    if (!ttagBin || !output || !files.length) {
        console.error('Usage node extract-parallel.mjs <ttagBin> <output> <file...>');
        process.exit(1);
    }

    const orderedFiles = resolveFilesInTtagOrder(files);
    const chunks = splitIntoContiguousChunks(orderedFiles, FILES_PER_CHUNK);
    const concurrency = getConcurrency();
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'proton-i18n-'));

    try {
        const templates = await mapWithConcurrency(chunks, concurrency, async (chunk, index) => {
            const chunkOutput = path.join(tmpDir, `${index}.pot`);
            await execFileAsync(ttagBin, ['extract', ...chunk, '-o', chunkOutput], { maxBuffer: 1 << 30 });
            return readFile(chunkOutput, 'utf8');
        });
        await writeFile(output, mergeTemplates(templates));
        console.log(
            `[+] ${orderedFiles.length} files extracted in ${chunks.length} chunk(s), ${concurrency} at a time, to ${output}`
        );
    } finally {
        await rm(tmpDir, { recursive: true, force: true });
    }
}

main(process.argv.slice(2)).catch((e) => {
    console.error(e.stderr || e.message);
    process.exit(1);
});
