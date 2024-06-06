export const TEST_SERVER_TIME = new Date(new Date().toUTCString());

export const mockAPIResponse = (
    result: any = {},
    status: number = 200,
    headers: HeadersInit = { date: TEST_SERVER_TIME.toUTCString() }
) =>
    ({
        json: () => Promise.resolve(result),
        body: { bodyUsed: false } as any,
        status,
        headers: new Headers(headers),
    }) as Response;
