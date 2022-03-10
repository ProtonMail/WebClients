import { useState } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { NotificationOptions } from './interfaces';

import createNotificationManager from './manager';

describe('notification manager', () => {
    it('should create a notification', () => {
        const { result } = renderHook(() => useState<NotificationOptions[]>([]));
        const [, setState] = result.current;

        const manager = createNotificationManager(setState);
        expect(result.current[0]).toStrictEqual([]);
        act(() => {
            manager.createNotification({
                text: 'hello',
            });
        });

        expect(result.current[0]).toStrictEqual([expect.objectContaining({ text: 'hello' })]);
    });

    describe('deduplication', () => {
        it('should not deduplicate a success notification', () => {
            const { result } = renderHook(() => useState<NotificationOptions[]>([]));
            const [, setState] = result.current;

            const manager = createNotificationManager(setState);
            act(() => {
                manager.createNotification({
                    text: 'foo',
                    type: 'success',
                });
                manager.createNotification({
                    text: 'foo',
                    type: 'success',
                });
                manager.createNotification({
                    text: 'bar',
                    type: 'success',
                });
            });

            expect(result.current[0]).toStrictEqual([
                expect.objectContaining({ text: 'foo' }),
                expect.objectContaining({ text: 'foo' }),
                expect.objectContaining({ text: 'bar' }),
            ]);
        });

        it('should deduplicate an error notification', () => {
            const { result } = renderHook(() => useState<NotificationOptions[]>([]));
            const [, setState] = result.current;

            const manager = createNotificationManager(setState);
            act(() => {
                manager.createNotification({
                    text: 'foo',
                    type: 'error',
                });
                manager.createNotification({
                    text: 'foo',
                    type: 'error',
                });
                manager.createNotification({
                    text: 'bar',
                    type: 'error',
                });
            });

            expect(result.current[0]).toStrictEqual([
                expect.objectContaining({ text: 'foo' }),
                expect.objectContaining({ text: 'bar' }),
            ]);
        });

        it('should deduplicate react elements using the provided key', () => {
            const { result } = renderHook(() => useState<NotificationOptions[]>([]));
            const [, setState] = result.current;

            const manager = createNotificationManager(setState);
            act(() => {
                manager.createNotification({
                    text: <div>text</div>,
                    key: 'item1',
                    type: 'error',
                });
                manager.createNotification({
                    text: <div>text</div>,
                    key: 'item1',
                    type: 'error',
                });
                manager.createNotification({
                    text: 'bar',
                    key: 'item2',
                    type: 'error',
                });
                // Do not deduplicate if key is not provided
                manager.createNotification({
                    text: <div>text</div>,
                    type: 'error',
                });
            });

            expect(result.current[0]).toStrictEqual([
                expect.objectContaining({ text: <div>text</div>, key: 'item1' }),
                expect.objectContaining({ text: 'bar', key: 'item2' }),
                expect.objectContaining({ text: <div>text</div> }),
            ]);
        });
    });

    it('should allow to create notifications with raw html text and deduplicate it', () => {
        const { result } = renderHook(() => useState<NotificationOptions[]>([]));
        const [, setState] = result.current;

        const manager = createNotificationManager(setState);
        act(() => {
            manager.createNotification({
                text: 'Foo <a href="https://foo.bar">text</a>',
                type: 'error',
            });
            manager.createNotification({
                text: 'Foo <a href="https://foo.bar">text</a>',
                type: 'error',
            });
        });

        expect(result.current[0]).toStrictEqual([
            expect.objectContaining({
                text: (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: 'Foo <a href="https://foo.bar" rel="noopener noreferrer" target="_blank">text</a>',
                        }}
                    />
                ),
                key: 'Foo <a href="https://foo.bar">text</a>',
            }),
        ]);
    });
});
