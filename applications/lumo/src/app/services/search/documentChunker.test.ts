import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

import type { DriveDocument } from '../../types/documents';
import { chunkDocument, splitSentences } from './documentChunker';

/** Source of the regex the fix replaced, kept as the behavioural oracle. */
const LEGACY_SENTENCE_SPLIT = /(?<=[.!?])\s+/;

const makeDoc = (content: string): DriveDocument => ({
    id: 'doc-1',
    name: 'big.txt',
    content,
    mimeType: 'text/plain',
    size: content.length,
    modifiedTime: 0,
    folderId: 'folder-1',
    folderPath: '/',
});

describe('splitSentences', () => {
    it.each([
        'First sentence here. Second one! Third? Fourth.',
        'No terminators or breaks at all',
        'Ends with a period. ',
        'Multiple   spaces. After them.',
        'Tabs\tbetween. Next.',
        'Newlines\nbetween. Next line.',
        'CRLF\r\nbetween. Next line.',
        // \s is wider than [ \t\r\n]; these must not change where we cut.
        'Vertical tab\u000bbetween. Next line.',
        'Form feed\u000fbetween. Next line.',
        'Nbsp\u00a0between. Next line.',
        'En space\u2002between. Next line.',
        'Ideographic space\u3000between. Next line.',
        'Line separator\u2028between. Next line.',
        'Abbreviation e.g. not a break. Real break.',
        'Mr. Smith went out. He came back!',
        '',
        '. Leading dot. Next.',
        'A.B.C. no spaces at all',
        'Trailing!!!',
        'One. Two. Three. Four. Five.',
    ])('matches the previous lookbehind split for %j', (text) => {
        expect(splitSentences(text)).toEqual(text.split(LEGACY_SENTENCE_SPLIT));
    });

    it('keeps the terminator attached to the sentence it closes', () => {
        expect(splitSentences('Alpha. Beta! Gamma?')).toEqual(['Alpha.', 'Beta!', 'Gamma?']);
    });

    it('agrees with the old split across randomised punctuation and whitespace', () => {
        const alphabet = ['a', 'B', '1', '.', '!', '?', ' ', '\t', '\n', '\r', '\u000b', '\u000c', '\u00a0', '\u2028'];
        for (let i = 0; i < 500; i++) {
            let text = '';
            for (let c = 0; c < 40; c++) {
                text += alphabet[randomBytes(1)[0] % alphabet.length];
            }
            expect(splitSentences(text)).toEqual(text.split(LEGACY_SENTENCE_SPLIT));
        }
    });
});

describe('chunkDocument', () => {
    it('splits an oversized document into whole sentences', () => {
        const sentence = 'The quick brown fox jumps over the lazy dog and keeps on running. ';
        // Comfortably past the 20k-token chunking threshold.
        const content = `${'# Heading\n\n'}${sentence.repeat(2000)}`;

        const chunks = chunkDocument(makeDoc(content));

        expect(chunks.length).toBeGreaterThan(1);
        for (const chunk of chunks) {
            expect(chunk.isChunk).toBe(true);
            expect(chunk.parentDocumentId).toBe('doc-1');
        }
        expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(chunks.map((_, index) => index));
        expect(chunks.every((chunk) => chunk.totalChunks === chunks.length)).toBe(true);
        // Sentences stay intact: every chunk is made of whole sentences, so rejoining the pieces
        // only ever reintroduces the separators the splitter removed.
        const rejoined = chunks.map((chunk) => chunk.content).join(' ');
        expect(rejoined.replace(/\s+/g, ' ')).toContain(sentence.trim());
    });

    it('returns the document untouched when it is under the chunking threshold', () => {
        const doc = makeDoc('Short enough to keep whole. Nothing to split.');
        expect(chunkDocument(doc)).toEqual([doc]);
    });
});

describe('documentChunker source', () => {
    it('contains no regex lookbehind, which Safari before 16.4 cannot parse', () => {
        // A lookbehind *literal* is a SyntaxError at parse time on those engines, so it takes the
        // whole module down rather than just failing one call. Strip comments first so this file's
        // own explanation of the old pattern cannot trip the check.
        const source = readFileSync(join(__dirname, 'documentChunker.ts'), 'utf8');
        const codeOnly = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
        const lookbehindLiteral = /\(\?<[=!]/;

        expect(codeOnly).not.toMatch(lookbehindLiteral);
    });
});
