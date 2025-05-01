import { useState } from 'react';

import { act, renderHook } from '@testing-library/react-hooks';

import noop from '@proton/utils/noop';

import type { Notification } from './interfaces';
import createNotificationManager from './manager';

describe('notification manager', () => {
    it('should create a notification', () => {
        const { result } = renderHook(() => useState<Notification[]>([]));
        const [, setState] = result.current;

        const manager = createNotificationManager(setState, noop);
        expect(result.current[0]).toStrictEqual([]);
        act(() => {
            manager.createNotification({
                text: 'hello',
            });
        });

        expect(result.current[0]).toStrictEqual([expect.objectContaining({ text: 'hello' })]);
    });

    it('should create a notification with a testID', () => {
        const { result } = renderHook(() => useState<Notification[]>([]));
        const [, setState] = result.current;

        const manager = createNotificationManager(setState, noop);
        expect(result.current[0]).toStrictEqual([]);
        act(() => {
            manager.createNotification({
                text: 'hello',
                dataTestId: 'notification-test-id',
            });
        });

        expect(result.current[0]).toStrictEqual([
            expect.objectContaining({ text: 'hello', dataTestId: 'notification-test-id' }),
        ]);
    });

    it('should create multiple notifications with a testID', () => {
        const { result } = renderHook(() => useState<Notification[]>([]));
        const [, setState] = result.current;

        const manager = createNotificationManager(setState, noop);
        expect(result.current[0]).toStrictEqual([]);
        act(() => {
            manager.createNotification({
                text: 'hello',
                dataTestId: 'notification-test-id',
            });
            manager.createNotification({
                text: 'second notification',
                dataTestId: 'second-notification-test-id',
            });
        });

        expect(result.current[0]).toStrictEqual([
            expect.objectContaining({ text: 'second notification', dataTestId: 'second-notification-test-id' }),
            expect.objectContaining({ text: 'hello', dataTestId: 'notification-test-id' }),
        ]);
    });

    it('should allow html and only allow href attr', () => {
        const { result } = renderHook(() => useState<Notification[]>([]));
        const [, setState] = result.current;

        const manager = createNotificationManager(setState, noop);
        expect(result.current[0]).toStrictEqual([]);
        act(() => {
            manager.createNotification({
                text: 'hello <a href="https://foo.bar" style="inline-size: 123px">link</a>',
            });
            manager.createNotification({
                text: '<b style="inline-size: 123px">bold</b>',
            });
        });

        expect(result.current[0]).toStrictEqual([
            expect.objectContaining({
                text: (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: '<b>bold</b>',
                        }}
                    />
                ),
            }),
            expect.objectContaining({
                text: (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: 'hello <a href="https://foo.bar" rel="noopener noreferrer" target="_blank" class="color-inherit">link</a>',
                        }}
                    />
                ),
            }),
        ]);
    });

    describe('deduplication', () => {
        describe('when deduplicate true', () => {
            it('should remove duplicate notifications', () => {
                const { result } = renderHook(() => useState<Notification[]>([]));
                const [, setState] = result.current;

                const manager = createNotificationManager(setState, noop);
                act(() => {
                    manager.createNotification({
                        text: 'foo',
                        type: 'success',
                        deduplicate: true,
                    });
                    manager.createNotification({
                        text: 'foo',
                        type: 'success',
                        deduplicate: true,
                    });
                    manager.createNotification({
                        text: 'bar',
                        type: 'success',
                    });
                });

                expect(result.current[0]).toStrictEqual([
                    expect.objectContaining({ text: 'bar' }),
                    expect.objectContaining({ text: 'foo' }),
                ]);
            });
        });

        describe('when deduplicate false', () => {
            it('should not remove duplicate notifications', () => {
                const { result } = renderHook(() => useState<Notification[]>([]));
                const [, setState] = result.current;

                const manager = createNotificationManager(setState, noop);
                act(() => {
                    manager.createNotification({
                        text: 'foo',
                        type: 'error',
                        deduplicate: false,
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
                    expect.objectContaining({ text: 'bar' }),
                    expect.objectContaining({ text: 'foo' }),
                    expect.objectContaining({ text: 'foo' }),
                ]);
            });
        });

        describe('when deduplicate is undefined', () => {
            it('should deduplicate a success notification', () => {
                const { result } = renderHook(() => useState<Notification[]>([]));
                const [, setState] = result.current;

                const manager = createNotificationManager(setState, noop);
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
                    expect.objectContaining({ text: 'bar' }),
                    expect.objectContaining({ text: 'foo' }),
                ]);
            });

            it('should deduplicate a warning notification', () => {
                const { result } = renderHook(() => useState<Notification[]>([]));
                const [, setState] = result.current;

                const manager = createNotificationManager(setState, noop);
                act(() => {
                    manager.createNotification({
                        text: 'foo',
                        type: 'warning',
                    });
                    manager.createNotification({
                        text: 'foo',
                        type: 'warning',
                    });
                    manager.createNotification({
                        text: 'bar',
                        type: 'warning',
                    });
                });

                expect(result.current[0]).toStrictEqual([
                    expect.objectContaining({ text: 'bar' }),
                    expect.objectContaining({ text: 'foo' }),
                ]);
            });

            it('should deduplicate a info notification', () => {
                const { result } = renderHook(() => useState<Notification[]>([]));
                const [, setState] = result.current;

                const manager = createNotificationManager(setState, noop);
                act(() => {
                    manager.createNotification({
                        text: 'foo',
                        type: 'info',
                    });
                    manager.createNotification({
                        text: 'foo',
                        type: 'info',
                    });
                    manager.createNotification({
                        text: 'bar',
                        type: 'info',
                    });
                });

                expect(result.current[0]).toStrictEqual([
                    expect.objectContaining({ text: 'bar' }),
                    expect.objectContaining({ text: 'foo' }),
                ]);
            });

            it('should deduplicate an error notification', () => {
                const { result } = renderHook(() => useState<Notification[]>([]));
                const [, setState] = result.current;

                const manager = createNotificationManager(setState, noop);
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
                    expect.objectContaining({ text: 'bar' }),
                    expect.objectContaining({ text: 'foo' }),
                ]);
            });
        });

        it('should deduplicate react elements using the provided key', () => {
            const { result } = renderHook(() => useState<Notification[]>([]));
            const [, setState] = result.current;

            const manager = createNotificationManager(setState, noop);
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
                expect.objectContaining({ text: <div>text</div> }),
                expect.objectContaining({ text: 'bar', key: 'item2' }),
                expect.objectContaining({ text: <div>text</div>, key: 'item1' }),
            ]);
        });
    });

    it('should allow to create notifications with raw html text and deduplicate it', () => {
        const { result } = renderHook(() => useState<Notification[]>([]));
        const [, setState] = result.current;

        const manager = createNotificationManager(setState, noop);
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
                            __html: 'Foo <a href="https://foo.bar" rel="noopener noreferrer" target="_blank" class="color-inherit">text</a>',
                        }}
                    />
                ),
                key: 'Foo <a href="https://foo.bar">text</a>',
            }),
        ]);
    });
});
