export const TEST_SERVER_TIME = new Date(new Date().toString());

export const mockAPIResponse = (
    result: any = {},
    status: number = 200,
    headers: HeadersInit = { date: TEST_SERVER_TIME.toString() }
) =>
    ({
        json: () => Promise.resolve(result),
        body: { bodyUsed: false } as any,
        status,
        headers: new Headers(headers),
    }) as Response;
