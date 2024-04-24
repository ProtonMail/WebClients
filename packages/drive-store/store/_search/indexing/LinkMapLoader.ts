import { wait } from '@proton/shared/lib/helpers/promise';
import { ShareMapLink } from '@proton/shared/lib/interfaces/drive/link';

import { createAsyncQueue } from '../../../utils/parallelRunners';
import { PAGE_SIZE } from '../constants';
import { fetchItemsMetadataPage } from './fetchItemsMetadataPage';
import { FetchShareMap } from './useFetchShareMap';

const PARALLEL_FETCH_LIMIT = 5;

export class LinkMapLoader {
    linkMetaRawByPage = new Map<number, ShareMapLink[]>();

    isDone: boolean = false;

    sessionName?: string;

    queue;

    fetchShareMapPage: FetchShareMap;

    constructor({ fetchShareMapPage }: { fetchShareMapPage: FetchShareMap }) {
        this.fetchShareMapPage = fetchShareMapPage;
        this.queue = createAsyncQueue(PARALLEL_FETCH_LIMIT);
    }

    async fetchAndCacheLinkPage(shareId: string, sessionName?: string, page?: number) {
        const { links, session } = await fetchItemsMetadataPage(shareId, this.fetchShareMapPage, sessionName, page);

        this.linkMetaRawByPage.set(page || 0, links);
        this.isDone = this.isDone || session.isDone;

        this.sessionName = session.sessionName;

        return {
            links,
            session,
        };
    }

    async fetchShareMap(shareId: string) {
        // Fetch first page separately to retrieve meta info of links map
        const { session } = await this.fetchAndCacheLinkPage(shareId);

        if (this.isDone) {
            return;
        }

        const pageCount = Math.ceil(session.total / PAGE_SIZE);

        for (let page = 1; page < pageCount; page++) {
            this.queue.addToQueue(() => this.fetchAndCacheLinkPage(shareId, this.sessionName, page));
        }
    }

    async *iterateItems() {
        let pageNumber = 0;
        while (!this.isDone || this.linkMetaRawByPage.size > 0) {
            const links = this.linkMetaRawByPage.get(pageNumber);
            if (links) {
                this.linkMetaRawByPage.delete(pageNumber);
                pageNumber += 1;
                yield links;
            } else {
                await wait(500);
            }
        }
    }
}
