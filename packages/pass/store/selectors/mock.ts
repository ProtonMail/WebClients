import { itemBuilder } from '../../lib/items/item.builder';
import { ItemState } from '../../types';
import { AutofillMode } from '../../types/protobuf';
import { getEpoch } from '../../utils/time/epoch';
import type { State } from '../types';

export const getStateMock = () =>
    ({
        items: {
            byShareId: {
                share1: {
                    item1: {
                        /* item with secure protocol */
                        itemId: 'share1-item1',
                        state: ItemState.Active,
                        shareId: 'share1',
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('autofillUrls', [
                                    { url: 'https://proton.me', mode: AutofillMode.Default },
                                    { url: 'https://subdomain.proton.me', mode: AutofillMode.Default },
                                ])
                                .set('itemEmail', 'test@proton.me')
                                .set('totpUri', '424242424242424242424242')
                        ).data,
                    },
                    item2: {
                        /* item with unsecure protocol */
                        itemId: 'share1-item2',
                        state: ItemState.Active,
                        shareId: 'share1',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'http://proton.me', mode: AutofillMode.Default }])
                        ).data,
                    },
                    item3: {
                        /* item with private domain */
                        itemId: 'share1-item3',
                        state: ItemState.Active,
                        shareId: 'share1',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'https://github.io', mode: AutofillMode.Default }])
                        ).data,
                    },
                    item4: {
                        /* item with private sub-domain */
                        itemId: 'share1-item4',
                        state: ItemState.Active,
                        shareId: 'share1',
                        data: itemBuilder('login')
                            .set('content', (content) =>
                                content
                                    .set('autofillUrls', [{ url: 'https://private.subdomain.github.io', mode: AutofillMode.Default }])
                                    .set('itemUsername', 'test@github.io')
                            )
                            .set('extraFields', [
                                {
                                    type: 'totp',
                                    data: { totpUri: '424242424242424242424242' },
                                    fieldName: 'totp',
                                },
                            ]).data,
                    },
                    item5: {
                        /* item with another private sub-domain */
                        itemId: 'share1-item5',
                        state: ItemState.Active,
                        shareId: 'share1',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'https://othersubdomain.github.io', mode: AutofillMode.Default }])
                        ).data,
                    },
                },
                share2: {
                    item1: {
                        /* trashed item with secure protocol */
                        itemId: 'share2-item1',
                        state: ItemState.Trashed,
                        shareId: 'share2',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'https://proton.me', mode: AutofillMode.Default }])
                        ).data,
                    },
                    item2: {
                        /* active item with unsecure protocol */
                        itemId: 'share2-item2',
                        state: ItemState.Active,
                        shareId: 'share2',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'http://proton.me', mode: AutofillMode.Default }])
                        ).data,
                    },
                },
                share3: {
                    item1: {
                        /* non http protocols & invalid urls */
                        itemId: 'share3-item1',
                        state: ItemState.Active,
                        shareId: 'share3',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [
                                { url: 'ftp://proton.me', mode: AutofillMode.Default },
                                { url: 'htp::://invalid', mode: AutofillMode.Default },
                            ])
                        ).data,
                    },
                    item2: {
                        /* type note */
                        itemId: 'share3-item2',
                        state: ItemState.Active,
                        shareId: 'share3',
                        data: itemBuilder('note').data,
                    },
                    item3: {
                        /* type alias */
                        itemId: 'share3-item3',
                        state: ItemState.Active,
                        shareId: 'share3',
                        data: itemBuilder('alias').data,
                    },
                    item4: {
                        /* active item with nested subdomain */
                        itemId: 'share3-item4',
                        state: ItemState.Active,
                        shareId: 'share3',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'https://sub.domain.google.com', mode: AutofillMode.Default }])
                        ).data,
                    },
                    item5: {
                        /* active item with nested subdomain */
                        itemId: 'share3-item5',
                        state: ItemState.Active,
                        shareId: 'share3',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'https://my.sub.domain.google.com', mode: AutofillMode.Default }])
                        ).data,
                    },
                    item6: {
                        /* active item with unsecure nested subdomain */
                        state: ItemState.Active,
                        itemId: 'share3-item6',
                        shareId: 'share3',
                        data: itemBuilder('login').set('content', (content) =>
                            content.set('autofillUrls', [{ url: 'https://google.com', mode: AutofillMode.Default }])
                        ).data,
                    },
                },
                share4: {/* empty share */},
                share5: {
                    item1: {
                        /* subdomain `A` OTP */
                        itemId: 'share5-item2',
                        state: ItemState.Active,
                        shareId: 'share5',
                        lastUseTime: getEpoch() + 1_200,
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('itemUsername', 'username@subdomain.com')
                                .set('autofillUrls', [{ url: 'https://a.subdomain.com', mode: AutofillMode.Default }])
                                .set('totpUri', '1212121212121212121212121212')
                        ).data,
                    },
                    item2: {
                        /* subdomain `B` OTP */
                        itemId: 'share5-item3',
                        state: ItemState.Active,
                        shareId: 'share5',
                        lastUseTime: getEpoch() + 1_000,
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('itemUsername', 'username@subdomain.com')
                                .set('autofillUrls', [{ url: 'https://b.subdomain.com', mode: AutofillMode.Default }])
                                .set('totpUri', '1212121212121212121212121212')
                        ).data,
                    },
                    item3: {
                        /* subdomain `B` OTP - more recently used */
                        itemId: 'share5-item3',
                        state: ItemState.Active,
                        shareId: 'share5',
                        lastUseTime: getEpoch() + 2_000,
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('itemUsername', 'username@subdomain.com')
                                .set('autofillUrls', [{ url: 'https://b.subdomain.com', mode: AutofillMode.Default }])
                                .set('totpUri', '1212121212121212121212121212')
                        ).data,
                    },
                    item4: {
                        /* top-level domain OTP */
                        itemId: 'share5-item4',
                        state: ItemState.Active,
                        shareId: 'share5',
                        lastUseTime: getEpoch(),
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('itemUsername', 'username@subdomain.com')
                                .set('autofillUrls', [{ url: 'https://subdomain.com', mode: AutofillMode.Default }])
                                .set('totpUri', '1212121212121212121212121212')
                        ).data,
                    },
                    item5: {
                        /* top-level domain OTP more recently used */
                        itemId: 'share5-item5',
                        state: ItemState.Active,
                        shareId: 'share5',
                        lastUseTime: getEpoch() + 2_000,
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('itemUsername', 'username@subdomain.com')
                                .set('autofillUrls', [{ url: 'https://subdomain.com', mode: AutofillMode.Default }])
                                .set('totpUri', '1212121212121212121212121212')
                        ).data,
                    },
                    item6: {
                        /* top-level domain OTP */
                        itemId: 'share5-item6',
                        state: ItemState.Active,
                        shareId: 'share5',
                        lastUseTime: getEpoch(),
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('itemUsername', 'username@subdomain.com')
                                .set('autofillUrls', [{ url: 'https://a.domain.com', mode: AutofillMode.Default }])
                                .set('totpUri', '1212121212121212121212121212')
                        ).data,
                    },
                },

                share6: {
                    // Hidden share
                    item1: {
                        itemId: 'share6-item1',
                        state: ItemState.Active,
                        shareId: 'share6',
                        lastUseTime: getEpoch(),
                        data: itemBuilder('login').set('content', (content) =>
                            content
                                .set('itemUsername', 'username@subdomain.com')
                                .set('autofillUrls', [{ url: 'https://domain-of-hidden-share.com', mode: AutofillMode.Default }])
                        ).data,
                    },
                },
                optimistic: { history: [], checkpoint: undefined },
            },
        },
        shares: {
            share1: { shareId: 'share1', flags: 0 },
            share2: { shareId: 'share2', flags: 0 },
            share3: { shareId: 'share3', flags: 0 },
            share4: { shareId: 'share4', flags: 0 },
            share5: { shareId: 'share5', flags: 0 },
            share6: { shareId: 'share6', flags: 1 },
        },
        sharesDedupe: {
            dedupeAndVisible: ['share1', 'share2', 'share3', 'share4', 'share5'],
        },
        user: {},
    }) as unknown as State;
