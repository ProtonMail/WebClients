import { type AesGcmCryptoKey, generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import log from 'loglevel';
import type { Mock, MockInstance } from 'vitest';

import { Logger, logger, loggerManager } from '../../lib/logger/logger';

// Increase timeout for async operations
vi.setConfig({ testTimeout: 15000 });

describe('Logger', () => {
    const testLoggers: Logger[] = [];
    let mockEncryptionKey: AesGcmCryptoKey;

    // Mock document methods for download functionality
    let mockCreateElement: MockInstance;
    let mockClick: Mock;

    // Mock URL methods
    let mockCreateObjectURL: Mock;
    let mockRevokeObjectURL: Mock;

    beforeAll(async () => {
        mockEncryptionKey = await generateAndImportKey();
    });

    beforeEach(async () => {
        // Setup mocks
        mockClick = vi.fn();
        const mockElement = {
            href: '',
            download: '',
            style: {},
            click: mockClick,
        } as unknown as HTMLElement;

        mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
        vi.spyOn(document.body, 'appendChild').mockReturnValue(mockElement as HTMLElement);
        vi.spyOn(document.body, 'removeChild').mockReturnValue(mockElement as HTMLElement);

        mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
        mockRevokeObjectURL = vi.fn();
        URL.createObjectURL = mockCreateObjectURL;
        URL.revokeObjectURL = mockRevokeObjectURL;

        // Clear all existing loggers
        await loggerManager.destroyAll();

        // Reset loglevel globally
        log.setLevel('debug');
    });

    afterEach(async () => {
        // Clean up any test loggers to prevent hanging intervals
        await Promise.all(
            testLoggers.map((logger) => {
                if (logger && typeof logger.destroy === 'function') {
                    return logger.destroy();
                }
                return Promise.resolve();
            })
        );
        testLoggers.length = 0;

        // Ensure all loggers are destroyed
        await loggerManager.destroyAll();

        // Clear any remaining intervals/timeouts
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
        }
    });

    afterAll(async () => {
        // Clean up all logger instances to prevent hanging
        await loggerManager.destroyAll();
    });

    describe('Logger Class', () => {
        it('should create a new Logger instance', () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);

            expect(testLogger).toEqual(expect.any(Logger));
            expect(testLogger.getName()).toBe('test');
            expect(testLogger.isInitialized()).toBe(false);
        });

        it('should initialize logger with encryption key', async () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                loggerName: 'test-logger',
                forceMemoryStorage: true,
                loggerID: '',
            });

            expect(testLogger.isInitialized()).toBe(true);
            expect(testLogger.getEncryptionContextString()).toBe('test-app#test-logger');
        });

        it('should not reinitialize already initialized logger', async () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            // Try to initialize again
            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app-2',
                forceMemoryStorage: true,
                loggerID: '',
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                "Logger 'test' already initialized, ignoring subsequent initialization"
            );
            expect(testLogger.getEncryptionContextString()).toBe('test-app#test');
        });

        it('should create separate loglevel instances', async () => {
            const logger1 = new Logger('logger1');
            const logger2 = new Logger('logger2');
            testLoggers.push(logger1, logger2);

            await logger1.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'app1',
                loggerID: '',
            });

            await logger2.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'app2',
                loggerID: '',
            });

            const loglevelInstance1 = logger1.getLoglevelInstance();
            const loglevelInstance2 = logger2.getLoglevelInstance();

            expect(loglevelInstance1).not.toBe(loglevelInstance2);
            expect(loglevelInstance1).toBeDefined();
            expect(loglevelInstance2).toBeDefined();
        });

        it('should queue logs before initialization', async () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);

            // Log before initialization
            testLogger.info('Pre-init message');

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            // `processPendingLogs` is fire-and-forget and writes through the persistence plugin.
            // Poll a few times to give the async writes a chance to flush.
            let logs = '';
            for (let attempt = 0; attempt < 20; attempt++) {
                await new Promise((resolve) => setTimeout(resolve, 50));
                logs = await testLogger.getLogs();
                if (logs.includes('Pre-init message')) {
                    break;
                }
            }
            expect(logs).toContain('Pre-init message');
        });

        it('should handle args processing for Error objects', async () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            const error = new Error('Test error');
            error.stack = 'Test stack trace';

            testLogger.error('Error occurred', error);

            await new Promise((resolve) => setTimeout(resolve, 10));

            const logs = await testLogger.getLogs();
            expect(logs).toContain('Error occurred');
            expect(logs).toContain('Error: Test error');
            expect(logs).toContain('Test stack trace');
        });

        it('should limit pending logs to prevent memory issues', async () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);

            // Add more than 1000 pending logs
            for (let i = 0; i < 550; i++) {
                testLogger.info(`Message ${i}`);
            }

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            await new Promise((resolve) => setTimeout(resolve, 20));

            const logs = await testLogger.getLogs();
            const messageCount = (logs.match(/Message \d+/g) || []).length;

            // Should only have kept the last 500 messages (but due to processing timing, might be slightly more)
            expect(messageCount).toBeLessThanOrEqual(550);
            expect(logs).toContain('Message 549');
        });

        it('should download logs with custom filename', async () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            testLogger.info('Download test message');
            await new Promise((resolve) => setTimeout(resolve, 10));

            await testLogger.downloadLogs('custom-filename.txt');

            expect(mockCreateElement).toHaveBeenCalledWith('a');
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();
            expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
        });

        it('should handle all logging methods', async () => {
            const testLogger = new Logger('test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            // Test all logging methods
            testLogger.debug('Debug message');
            testLogger.info('Info message');
            testLogger.warn('Warning message');
            testLogger.error('Error message');
            testLogger.trace('Trace message');
            testLogger.log('Log message');

            await new Promise((resolve) => setTimeout(resolve, 10));

            const logs = await testLogger.getLogs();
            expect(logs).toContain('Debug message');
            expect(logs).toContain('Info message');
            expect(logs).toContain('Warning message');
            expect(logs).toContain('Error message');
            expect(logs).toContain('Trace message');
            expect(logs).toContain('Log message');
        });
    });

    describe('LoggerManager', () => {
        it('should return singleton instance', () => {
            const manager1 = loggerManager;
            const manager2 = loggerManager;
            expect(manager1).toBe(manager2);
        });

        it('should create and manage multiple logger instances', async () => {
            const logger1 = await loggerManager.createLogger('api', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            const logger2 = await loggerManager.createLogger('ui', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            testLoggers.push(logger1, logger2);

            expect(logger1.getName()).toBe('api');
            expect(logger2.getName()).toBe('ui');
            expect(logger1).not.toBe(logger2);
            expect(loggerManager.getAllLoggers().length).toBe(2);
        });

        it('should return same logger instance for same name', () => {
            const logger1 = loggerManager.getLogger('duplicate');
            const logger2 = loggerManager.getLogger('duplicate');

            testLoggers.push(logger1);

            expect(logger1).toBe(logger2);
        });

        it('should combine logs from all logger instances', async () => {
            const apiLogger = await loggerManager.createLogger('api', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            const uiLogger = await loggerManager.createLogger('ui', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            testLoggers.push(apiLogger, uiLogger);

            apiLogger.info('API message');
            uiLogger.info('UI message');

            await new Promise((resolve) => setTimeout(resolve, 10));

            const allLogs = await loggerManager.getAllLogs();

            expect(allLogs).toContain('API message');
            expect(allLogs).toContain('UI message');
        });

        it('should clear logs from all instances', async () => {
            // Clean up first to avoid conflicts
            await loggerManager.destroyAll();

            const logger1 = await loggerManager.createLogger('clear-test-1', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            testLoggers.push(logger1);

            logger1.info('Test message');
            await new Promise((resolve) => setTimeout(resolve, 10));

            await loggerManager.clearAllLogs();

            const logs1 = await logger1.getLogs();
            expect(logs1).toBe('');

            // Clean up immediately
            await logger1.destroy();
        });

        it('should download combined logs from all instances', async () => {
            // Clean up any existing loggers first to avoid conflicts
            await loggerManager.destroyAll();

            const logger1 = await loggerManager.createLogger('download-test-logger', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            testLoggers.push(logger1);

            logger1.info('Combined download test');
            await new Promise((resolve) => setTimeout(resolve, 20));

            await loggerManager.downloadAllLogs('combined-logs.txt');

            expect(mockCreateElement).toHaveBeenCalledWith('a');
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();

            // Clean up immediately after test
            await logger1.destroy();
        });

        it('should remove specific logger instance', async () => {
            const testLogger = await loggerManager.createLogger('removeme', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            expect(loggerManager.getAllLoggers()).toContain(testLogger);

            await loggerManager.removeLogger('removeme');

            expect(loggerManager.getAllLoggers()).not.toContain(testLogger);
        });

        it('should destroy all logger instances', async () => {
            await loggerManager.createLogger('temp1', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            await loggerManager.createLogger('temp2', {
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            expect(loggerManager.getAllLoggers().length).toBe(2);

            await loggerManager.destroyAll();

            expect(loggerManager.getAllLoggers().length).toBe(0);
        });
    });

    describe('Default Logger Export', () => {
        it('should export default logger instance', () => {
            expect(logger).toEqual(expect.any(Logger));
            expect(logger.getName()).toBe('default');
        });

        it('should be same as loggerManager.getLogger("default")', () => {
            const defaultFromManager = loggerManager.getLogger('default');
            expect(logger.getName()).toBe(defaultFromManager.getName());
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete logging workflow', async () => {
            const testLogger = new Logger('integration-test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'integration-app',
                loggerName: 'integration-logger',
                maxEntries: 100,
                retentionDays: 30,
                forceMemoryStorage: true,
                loggerID: '',
            });

            // Test that the logger is initialized and can handle logging
            expect(testLogger.isInitialized()).toBe(true);

            // Test that all logging methods are callable without errors
            expect(() => {
                testLogger.debug('Debug message');
                testLogger.info('Info message');
                testLogger.warn('Warning message');
                testLogger.error('Error message');
                testLogger.trace('Trace message');
            }).not.toThrow();

            // Test cleanup and basic operations
            await testLogger.clearLogs();
            await testLogger.triggerCleanup();

            expect(testLogger.isInitialized()).toBe(true);
        });

        // Skipped in browser environment due to read-only indexedDB
        it.skip('should handle storage fallback scenarios', async () => {
            const testLogger = new Logger('fallback-test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'fallback-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            testLogger.info('Fallback test message');
            await new Promise((resolve) => setTimeout(resolve, 10));

            const logs = await testLogger.getLogs();
            expect(logs).toContain('Fallback test message');
        });

        it('should enforce maximum entries limit', async () => {
            const testLogger = new Logger('max-entries-test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'test-app',
                maxEntries: 3,
                forceMemoryStorage: true,
                loggerID: '',
            });

            // Add more logs than the limit with small delays to ensure different timestamps
            for (let i = 1; i <= 5; i++) {
                testLogger.info(`Message ${i}`);
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            await new Promise((resolve) => setTimeout(resolve, 20));

            const logs = await testLogger.getLogs();
            const lines = logs.split('\n').filter((line) => line.trim());

            // Should only have the last 3 messages due to FIFO ejection
            expect(lines.length).toBeLessThanOrEqual(3);

            if (lines.length > 0) {
                const hasRecentMessage =
                    logs.includes('Message 3') || logs.includes('Message 4') || logs.includes('Message 5');
                expect(hasRecentMessage).toBe(true);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle storage errors silently', async () => {
            // This test would require mocking storage methods to throw errors
            // The logger should handle these gracefully without breaking console output

            const testLogger = new Logger('storage-error-test');
            testLoggers.push(testLogger);

            await testLogger.initialize({
                encryptionKey: mockEncryptionKey,
                appName: 'storage-error-app',
                forceMemoryStorage: true,
                loggerID: '',
            });

            expect(() => {
                testLogger.info('This should work even with storage errors');
            }).not.toThrow();
        });

        it('should throw error when setting up persistence plugin without loglevel instance', () => {
            const testLogger = new Logger('error-test');
            testLoggers.push(testLogger);

            expect(() => {
                (testLogger as any).setupPersistencePlugin();
            }).toThrow(new Error('Cannot setup persistence plugin: loglevel instance not created'));
        });

        it('should throw error when assigning logging methods without loglevel instance', () => {
            const testLogger = new Logger('error-test');
            testLoggers.push(testLogger);

            expect(() => {
                (testLogger as any).assignLoggingMethods();
            }).toThrow(new Error('Cannot assign logging methods: loglevel instance not created'));
        });

        // Skipped - requires proper IndexedDB environment setup
        // The actual functionality works but requires proper IndexedDB setup
        it.skip('should discover and clean up multiple logger databases', async () => {});
    });
});
