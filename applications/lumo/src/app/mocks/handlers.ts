import type { HttpHandler } from 'msw';
import { HttpResponse, http } from 'msw';

// Helper functions and types that are safe to include in any build
const formatSSEMessage = (data: any) => `data: ${JSON.stringify(data)}\n\n`;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createStream = (generator: () => AsyncGenerator<string>) => {
    return new ReadableStream({
        async start(controller) {
            try {
                console.log('🔶 Mock Stream: Starting stream');
                for await (const chunk of generator()) {
                    console.log('🔶 Mock Stream: Sending chunk:', chunk);
                    controller.enqueue(new TextEncoder().encode(chunk));
                }
                console.log('🔶 Mock Stream: Stream complete');
                controller.close();
            } catch (error) {
                console.error('🔶 Mock Stream: Error:', error);
                controller.error(error);
            }
        },
    });
};

// Different test scenarios
const scenarios = {
    success: async function* () {
        console.log('🔶 Mock Scenario: Running success scenario');

        // Initial ingesting message
        yield formatSSEMessage({
            type: 'ingesting',
            target: 'message',
        });
        await delay(300);

        // Empty messages with increasing count
        for (let i = 0; i < 5; i++) {
            yield formatSSEMessage({
                type: 'token_data',
                target: 'message',
                count: i,
                content: '',
            });
            await delay(40);
        }

        // The joke response broken into tokens
        // const response = "Why don't programmers like nature? They have too many bugs!";
        const tokens = [
            '(Mocked) ',
            'Why ',
            "don't ",
            'prog',
            'rammers ',
            'like ',
            'nat',
            'ure',
            '? ',
            'They ',
            'have ',
            'too ',
            'many ',
            'bu',
            'gs!',
        ];

        for (let i = 0; i < tokens.length; i++) {
            yield formatSSEMessage({
                type: 'token_data',
                target: 'message',
                count: i + 5,
                content: tokens[i],
            });
            await delay(40);
        }

        // Done message
        yield formatSSEMessage({
            type: 'done',
        });
    },

    error: async function* () {
        console.log('🔶 Mock Scenario: Running error scenario');
        await delay(400);
        yield formatSSEMessage({
            type: 'error',
            message: 'Test error message',
        });
    },

    timeout: async function* () {
        console.log('🔶 Mock Scenario: Running timeout scenario');
        await delay(400);

        yield formatSSEMessage({
            type: 'timeout',
            message: 'High demand error',
        });
    },

    rejected: async function* () {
        console.log('🔶 Mock Scenario: Running rejected scenario');
        await delay(400);

        yield formatSSEMessage({
            type: 'rejected',
        });
    },

    toolCall: async function* () {
        console.log('🔶 Mock Scenario: Running tool call scenario');

        // Initial ingesting message
        yield formatSSEMessage({
            type: 'ingesting',
            target: 'message',
        });
        await delay(400);

        yield formatSSEMessage({
            type: 'token_data',
            target: 'tool_call',
            content: '{"name": "web_search", "parameters": {"search_term": "test search"}}',
        });
        await delay(500);

        yield formatSSEMessage({
            type: 'token_data',
            target: 'tool_result',
            content: 'Mock search result data',
        });
        await delay(300);

        // Stream the response
        const tokens = [
            'Based ',
            'on ',
            'the ',
            'search ',
            'results',
            ', ',
            'here ',
            'is ',
            'what ',
            'I ',
            'found',
            '.',
        ];

        for (let i = 0; i < tokens.length; i++) {
            yield formatSSEMessage({
                type: 'token_data',
                target: 'message',
                count: i,
                content: tokens[i],
            });
            await delay(40);
        }

        yield formatSSEMessage({
            type: 'done',
        });
    },

    // TODO: update with weekly limit Error right now this is a general 429. need BE jails to be updted
    weeklyLimit: () => {
        console.log('🔶 Mock Scenario: Running weekly limit error scenario');
        return new HttpResponse(
            JSON.stringify({
                Code: 2028,
                Error: 'Too many requests. Please try again later.',
            }),
            {
                status: 429,
            }
        );
    },
};

// Initialize handlers based on environment
const handlers: HttpHandler[] = [];

if (process.env.NODE_ENV === 'development') {
    const devHandler = http.post('https://ml-labs.protontech.ch/jade-api/generation', async ({ request }) => {
        console.log('🔶 Mock Handler: Request URL:', request.url);
        console.log('🔶 Mock Handler: Intercepted generation request', await request.json());

        // Using dynamic import for development only
        const { mockConfig } = await import('./mockConfig');
        const scenario = mockConfig.getScenario();
        console.log('🔶 Mock Handler: Using scenario:', scenario);

        if (scenario === 'weeklyLimit') {
            return scenarios.weeklyLimit();
        }

        const generator = scenarios[scenario as Exclude<keyof typeof scenarios, 'weeklyLimit'>];
        return new HttpResponse(createStream(generator), {
            headers: {
                'Content-Type': 'text/event-stream',
                Connection: 'keep-alive',
                'Cache-Control': 'no-cache',
            },
        });
    });

    handlers.push(devHandler);
}

export { handlers };
