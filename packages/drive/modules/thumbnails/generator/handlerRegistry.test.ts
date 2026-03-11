import { ThumbnailType } from '@protontech/drive-sdk';

import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { HandlerRegistry, ThumbnailProcessor } from './handlerRegistry';
import type { GenericHandler } from './handlers/interfaces';
import { NoHandlerError } from './thumbnailError';

const createMockHandler = (canHandle: boolean, handlerName: string = 'MockHandler'): GenericHandler => {
    return {
        handlerName,
        canHandle: jest.fn().mockReturnValue(canHandle),
        generate: jest.fn().mockResolvedValue({
            thumbnails: { thumbnails: [] },
        }),
    };
};

const createEmptyRegistry = (): HandlerRegistry => {
    const registry = Object.create(HandlerRegistry.prototype);
    registry.handlers = [];
    registry.registerHandler = HandlerRegistry.prototype.registerHandler;
    registry.findHandler = HandlerRegistry.prototype.findHandler;
    registry.getHandlers = HandlerRegistry.prototype.getHandlers;
    return registry;
};

describe('HandlerRegistry', () => {
    it('should find handler for supported mime type', async () => {
        const registry = createEmptyRegistry();

        const handler = createMockHandler(true);
        registry.registerHandler(handler);

        const found = await registry.findHandler('test.jpg', 'image/jpeg');

        expect(found).toBe(handler);
        expect(handler.canHandle).toHaveBeenCalled();
    });

    it('should return null when no handler found', async () => {
        const registry = createEmptyRegistry();

        const found = await registry.findHandler('test.unknown', 'application/unknown');

        expect(found).toBeNull();
    });

    it('should register multiple handlers and find first match', async () => {
        const registry = createEmptyRegistry();

        const handler1 = createMockHandler(false);
        const handler2 = createMockHandler(true);
        registry.registerHandler(handler1);
        registry.registerHandler(handler2);

        const found = await registry.findHandler('test.jpg', 'image/jpeg');

        expect(found).toBe(handler2);
    });
});

describe('ThumbnailProcessor', () => {
    it('should process file with handler', async () => {
        const handler = createMockHandler(true, 'TestHandler');
        const registry = createEmptyRegistry();
        registry.registerHandler(handler);

        const processor = new ThumbnailProcessor(registry);
        const blob = new Blob(['test'], { type: 'image/jpeg' });

        const result = await processor.process(
            blob,
            'test.jpg',
            blob.size,
            SupportedMimeTypes.webp,
            [ThumbnailType.Type1],
            false,
            'image/jpeg'
        );

        expect(result.generationInfo.handler).toBe('TestHandler');
        expect(handler.generate).toHaveBeenCalled();
    });

    it('should throw NoHandlerError when no handler found', async () => {
        const registry = createEmptyRegistry();

        const processor = new ThumbnailProcessor(registry);
        const blob = new Blob(['test'], { type: 'application/unknown' });

        await expect(
            processor.process(
                blob,
                'test.unknown',
                blob.size,
                SupportedMimeTypes.webp,
                [ThumbnailType.Type1],
                false,
                'application/unknown'
            )
        ).rejects.toThrow(NoHandlerError);
    });

    it('should include performance data when debug enabled', async () => {
        const handler: GenericHandler = {
            handlerName: 'PerformanceTestHandler',
            canHandle: jest.fn().mockReturnValue(true),
            generate: jest.fn().mockResolvedValue({
                thumbnails: { thumbnails: [] },
                performance: { generationTime: '10ms' },
            }),
        };
        const registry = createEmptyRegistry();
        registry.registerHandler(handler);

        const processor = new ThumbnailProcessor(registry);
        const blob = new Blob(['test'], { type: 'image/jpeg' });

        const result = await processor.process(
            blob,
            'test.jpg',
            blob.size,
            SupportedMimeTypes.webp,
            [ThumbnailType.Type1],
            true,
            'image/jpeg'
        );

        expect(result.performance).toBeDefined();
        expect(result.performance).toEqual({ generationTime: '10ms' });
    });

    it('should not include performance data when debug disabled', async () => {
        const handler = createMockHandler(true);
        const registry = createEmptyRegistry();
        registry.registerHandler(handler);

        const processor = new ThumbnailProcessor(registry);
        const blob = new Blob(['test'], { type: 'image/jpeg' });

        const result = await processor.process(
            blob,
            'test.jpg',
            blob.size,
            SupportedMimeTypes.webp,
            [ThumbnailType.Type1],
            false,
            'image/jpeg'
        );

        expect(result.performance).toBeUndefined();
    });
});
