declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchResponse(expected: Response): Promise<R>;
        }
    }
}

export {};
