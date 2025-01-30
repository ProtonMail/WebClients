import { renderHook } from '@testing-library/react-hooks';

import useItemsSelection from './useItemsSelection';

describe('useItemsSelection', () => {
    const allIDs = ['id1', 'id2', 'id3'];

    describe('selectedIDs', () => {
        describe('when no items are checked', () => {
            it('should return empty array when no activeID is provided', () => {
                const { result } = renderHook(() => useItemsSelection({ allIDs }));
                expect(result.current.selectedIDs).toEqual([]);
            });

            it('should return activeID by default with no specific mode', () => {
                const { result } = renderHook(() =>
                    useItemsSelection({
                        allIDs,
                        activeID: 'id1',
                    })
                );
                expect(result.current.selectedIDs).toEqual(['id1']);
            });

            describe('in row mode', () => {
                it('should return activeID', () => {
                    const { result } = renderHook(() =>
                        useItemsSelection({
                            allIDs,
                            activeID: 'id1',
                            rowMode: true,
                        })
                    );
                    expect(result.current.selectedIDs).toEqual(['id1']);
                });
            });

            describe('in conversation mode', () => {
                it('should return activeID when conversationMode is true', () => {
                    const { result } = renderHook(() =>
                        useItemsSelection({
                            allIDs,
                            activeID: 'conv1',
                            conversationMode: true,
                        })
                    );
                    expect(result.current.selectedIDs).toEqual(['conv1']);
                });

                it('should return messageID when provided', () => {
                    const { result } = renderHook(() =>
                        useItemsSelection({
                            allIDs,
                            activeID: 'conv1',
                            messageID: 'msg1',
                            conversationMode: false,
                        })
                    );
                    expect(result.current.selectedIDs).toEqual(['msg1']);
                });
            });
        });

        describe('when items are checked', () => {
            it('should return checked items instead of activeID', () => {
                const { result } = renderHook(() =>
                    useItemsSelection({
                        allIDs,
                        activeID: 'id1',
                    })
                );

                result.current.handleCheckOnlyOne('id2');
                expect(result.current.selectedIDs).toEqual(['id2']);
            });

            it('should handle multiple checked items', () => {
                const { result } = renderHook(() =>
                    useItemsSelection({
                        allIDs,
                        activeID: 'id1',
                    })
                );

                result.current.handleCheck(['id1', 'id2'], true, true);
                expect(result.current.selectedIDs).toEqual(['id1', 'id2']);
            });

            it('should maintain checked items even with messageID present', () => {
                const { result } = renderHook(() =>
                    useItemsSelection({
                        allIDs,
                        activeID: 'conv1',
                        messageID: 'msg1',
                    })
                );

                result.current.handleCheck(['id1', 'id2'], true, true);
                expect(result.current.selectedIDs).toEqual(['id1', 'id2']);
            });
        });

        describe('when clearing selection', () => {
            it('should return to activeID in conversation mode', () => {
                const { result } = renderHook(() =>
                    useItemsSelection({
                        allIDs,
                        activeID: 'id1',
                        conversationMode: true,
                    })
                );

                result.current.handleCheck(['id1', 'id2'], true, true);
                expect(result.current.selectedIDs).toEqual(['id1', 'id2']);

                result.current.handleCheckAll(false);
                expect(result.current.selectedIDs).toEqual(['id1']);
            });

            it('should return empty array when no activeID', () => {
                const { result } = renderHook(() =>
                    useItemsSelection({
                        allIDs,
                    })
                );

                result.current.handleCheck(['id1', 'id2'], true, true);
                expect(result.current.selectedIDs).toEqual(['id1', 'id2']);

                result.current.handleCheckAll(false);
                expect(result.current.selectedIDs).toEqual([]);
            });
        });
    });
});
