import type { ClientToolExecutor } from '@proton/lumo-api-client/core/client-tools';

import { retrieveDocumentContextForProject } from '../../../lib/rag';
import { countTokens } from '../../../llm/tokenizer';
import { SearchService } from '../../../services/search/searchService';
import { CASES, PROJECT_SPACE, type RetrievalCase, toDriveDocuments } from './__fixtures__/retrievalCorpus';
import { createRetrievalToolExecutor } from './retrievalTool';
import { READ_KNOWLEDGE_TOOL_NAME, SEARCH_KNOWLEDGE_TOOL_NAME } from './schema';

/*
 * Retrieval benchmark on a fixed project knowledge base (see `__fixtures__/retrievalCorpus.ts`).
 *
 * For each question, the lookup tools are driven the way a model would: one project search with
 * the case's keywords, then one read of the top hit, whose `mentioned_files` lead to referenced
 * files. A case passes when every file the answer needs was reached. The old pre-send search
 * (RAG) runs on the same questions for comparison.
 *
 * Known gaps use `it.failing`: when ranking improves enough to find them, Jest reports the
 * unexpected pass, and the case should become a regular one.
 *
 * Set RETRIEVAL_REPORT=1 to print a per-question table of both paths, including the tools
 * searched with the user's question verbatim (what a weak model might send).
 */

const index = SearchService.get();

beforeAll(async () => {
    await index.clearDriveDocuments();
    await index.indexDocuments(toDriveDocuments());
    jest.spyOn(SearchService, 'get').mockReturnValue(index);
});

afterAll(async () => {
    jest.restoreAllMocks();
    await index.clearDriveDocuments();
});

const executor = (): ClientToolExecutor =>
    createRetrievalToolExecutor({
        conversationId: 'conversation',
        spaceId: PROJECT_SPACE,
        isProject: true,
        allowWideScopes: true,
        chatSearch: 'none',
        searchOtherSpaces: false,
        hasLumoPlus: true,
        getVisibleMessageIds: () => new Set(),
        chatAttachments: [],
        getState: () => ({ conversations: {}, messages: {} }),
        index,
    });

async function call(tools: ClientToolExecutor, name: string, args: unknown) {
    const [result] = await tools.execute([{ id: 'call', name, arguments: JSON.stringify(args) }]);
    return JSON.parse(result!.content);
}

/** Files reached with one search and one read of the top hit, and the tokens that brought in. */
async function viaTools({ query }: RetrievalCase) {
    const tools = executor();
    const search = await call(tools, SEARCH_KNOWLEDGE_TOOL_NAME, { query });
    const found: string[] = search.results.map((result: { file_id: string }) => result.file_id);
    let tokens = countTokens(JSON.stringify(search));
    const reached = new Set(found);
    if (found[0]) {
        const read = await call(tools, READ_KNOWLEDGE_TOOL_NAME, { file_id: found[0] });
        tokens += countTokens(JSON.stringify(read));
        (read.mentioned_files ?? []).forEach((file: { file_id: string }) => reached.add(file.file_id));
    }
    return { found, reached, tokens };
}

/** Files the old path attaches before sending, and their size. */
async function viaPreSendSearch({ question }: RetrievalCase) {
    const result = await retrieveDocumentContextForProject(question, PROJECT_SPACE, 'user', true);
    const attachments = result?.attachments ?? [];
    return {
        reached: new Set(attachments.map((attachment) => attachment.driveNodeId ?? attachment.id)),
        tokens: attachments.reduce((sum, attachment) => sum + countTokens(attachment.markdown ?? ''), 0),
    };
}

const needed = (testCase: RetrievalCase) => [...testCase.expected, ...(testCase.viaReference ?? [])];

describe('lookup tools', () => {
    const solvable = CASES.filter((testCase) => !testCase.knownGap);
    const gaps = CASES.filter((testCase) => testCase.knownGap);

    it.each(solvable.map((testCase) => [testCase.question, testCase] as const))(
        'reach the files needed for "%s"',
        async (_question, testCase) => {
            const { reached } = await viaTools(testCase);

            expect([...reached]).toEqual(expect.arrayContaining(needed(testCase)));
        }
    );

    it.each(solvable.map((testCase) => [testCase.question, testCase] as const))(
        'rank the answer in the top 3 for "%s"',
        async (_question, testCase) => {
            const { found } = await viaTools(testCase);

            expect(found.slice(0, 3)).toEqual(expect.arrayContaining(testCase.expected));
        }
    );

    it.failing.each(gaps.map((testCase) => [testCase.question, testCase.knownGap] as const))(
        'known gap: "%s" (%s)',
        async (question) => {
            const testCase = gaps.find((gap) => gap.question === question)!;
            const { reached } = await viaTools(testCase);

            expect([...reached]).toEqual(expect.arrayContaining(needed(testCase)));
        }
    );
});

describe('compared with the pre-send search', () => {
    it('the tools reach every needed file the pre-send search finds', async () => {
        for (const testCase of CASES) {
            const tools = await viaTools(testCase);
            const preSend = await viaPreSendSearch(testCase);
            const missed = needed(testCase).filter((id) => preSend.reached.has(id) && !tools.reached.has(id));

            expect({ question: testCase.question, missed }).toEqual({ question: testCase.question, missed: [] });
        }
    });

    it('report', async () => {
        if (!process.env.RETRIEVAL_REPORT) {
            return;
        }
        const rows = [];
        for (const testCase of CASES) {
            const tools = await viaTools(testCase);
            const verbatim = await viaTools({ ...testCase, query: testCase.question });
            const preSend = await viaPreSendSearch(testCase);
            const score = (reached: Set<string>) =>
                `${needed(testCase).filter((id) => reached.has(id)).length}/${needed(testCase).length}`;
            rows.push(
                [
                    testCase.question.padEnd(52),
                    `tools ${score(tools.reached)} (${tools.tokens} tokens)`.padEnd(26),
                    `tools, question as query ${score(verbatim.reached)}`.padEnd(30),
                    `pre-send ${score(preSend.reached)} (${preSend.tokens} tokens, ${preSend.reached.size} files)`,
                ].join(' | ')
            );
        }
        process.stdout.write(`\nRetrieval benchmark\n${rows.join('\n')}\n`);
    });
});
