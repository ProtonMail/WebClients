export function useMessageSearch() {
    return {
        indexingStatus: { isIndexing: false, indexed: 0, total: 0, error: null } as {
            isIndexing: boolean;
            indexed?: number;
            total?: number;
            error: string | null;
        },
        isReady: true,
    };
}

