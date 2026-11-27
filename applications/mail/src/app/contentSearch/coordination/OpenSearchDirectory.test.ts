import { locks } from 'node:worker_threads';

import { flush, track } from '../testing/settlement';
import type { OpenSearchDirectory } from './OpenSearchDirectory';
import { OpenSearchDirectory as SingleTabOpenSearchDirectory } from './singleTab/OpenSearchDirectory';
import { OpenSearchDirectory as WebLocksOpenSearchDirectory } from './weblock/OpenSearchDirectory';

const lockManager = locks as unknown as LockManager;

let userCounter = 0;

describe.each<[string, (userId: string) => OpenSearchDirectory]>([
    [
        'Web Locks',
        (userId) => {
            return new WebLocksOpenSearchDirectory(userId, lockManager);
        },
    ],
    [
        'single tab',
        () => {
            return new SingleTabOpenSearchDirectory();
        },
    ],
])('%s OpenSearchDirectory', (_name, create) => {
    let directory: OpenSearchDirectory;

    beforeEach(() => {
        directory = create(`open-search-directory-${userCounter++}`);
    });

    it('lists nothing when no search is open', async () => {
        expect(await directory.list()).toEqual(new Map());
    });

    it('lists the open searches until they are closed', async () => {
        const closeFirst = await directory.open('search-1', 'hello', vi.fn());
        const closeSecond = await directory.open('search-2', 'from~a@b.com AND (labelId=\\0 OR labelId=L:1)', vi.fn());

        expect(await directory.list()).toEqual(
            new Map([
                ['search-1', 'hello'],
                ['search-2', 'from~a@b.com AND (labelId=\\0 OR labelId=L:1)'],
            ])
        );

        closeFirst();
        await flush();
        expect(await directory.list()).toEqual(
            new Map([['search-2', 'from~a@b.com AND (labelId=\\0 OR labelId=L:1)']])
        );

        closeSecond();
        await flush();
        expect(await directory.list()).toEqual(new Map());
    });

    it('never reports missed updates', async () => {
        const onMissedUpdates = vi.fn();
        const close = await directory.open('search-1', 'hello', onMissedUpdates);
        close();
        await flush();

        expect(onMissedUpdates).not.toHaveBeenCalled();
    });
});

describe('Web Locks OpenSearchDirectory across tabs', () => {
    const openTabs = () => {
        const userId = `open-search-directory-tabs-${userCounter++}`;
        return {
            first: new WebLocksOpenSearchDirectory(userId, lockManager),
            second: new WebLocksOpenSearchDirectory(userId, lockManager),
            otherUser: new WebLocksOpenSearchDirectory(`${userId}-other`, lockManager),
        };
    };

    it('lists the searches of every tab of the user, and only theirs', async () => {
        const { first, second, otherUser } = openTabs();
        await first.open('search-1', 'hello', vi.fn());
        await second.open('search-2', 'world', vi.fn());
        await otherUser.open('search-3', 'other', vi.fn());

        const expected = new Map([
            ['search-1', 'hello'],
            ['search-2', 'world'],
        ]);
        expect(await first.list()).toEqual(expected);
        expect(await second.list()).toEqual(expected);
    });

    it('fails the opening when the lock request is rejected, rather than never settling', async () => {
        const rejecting = {
            request: () => {
                return Promise.reject(new DOMException('the document is not fully active', 'InvalidStateError'));
            },
        } as unknown as LockManager;
        const directory = new WebLocksOpenSearchDirectory(`open-search-directory-tabs-${userCounter++}`, rejecting);

        await expect(directory.open('search-1', 'hello', vi.fn())).rejects.toThrow('the document is not fully active');
    });

    it('resolves the opening at once, as every search has a lock of its own', async () => {
        const { first, second } = openTabs();
        await first.open('search-1', 'hello', vi.fn());

        const opened = track(second.open('search-2', 'hello', vi.fn()));
        await flush();

        expect(opened.state.settled).toBe(true);
    });
});
