import type { ClientEndpoint, TabId } from '@proton/pass/types';

import { generatePortName, tabIDFromPortName } from './port';

describe('port utils', () => {
    describe('`generatePortName`', () => {
        test('should create a port name with the format "{endpoint}-{tabId}-{uniqueId}"', () => {
            const endpoint: ClientEndpoint = 'popup';
            const tabId: TabId = 123;
            const portName = generatePortName(endpoint, tabId);

            expect(portName).toMatch(/^popup-123-[0-9a-f]{16}$/);
        });

        test('should generate different port names for the same inputs', () => {
            const endpoint: ClientEndpoint = 'contentscript';
            const tabId: TabId = 456;
            const portName1 = generatePortName(endpoint, tabId);
            const portName2 = generatePortName(endpoint, tabId);

            expect(portName1).not.toEqual(portName2);
            expect(portName1).toMatch(/^contentscript-456-[0-9a-f]{16}$/);
            expect(portName2).toMatch(/^contentscript-456-[0-9a-f]{16}$/);
        });
    });

    describe('`tabIDFromPortName`', () => {
        test('should extract the tab ID from a port name', () => {
            expect(tabIDFromPortName('popup-123-abcdef1234567890')).toBe(123);
            expect(tabIDFromPortName('contentscript-456-0123456789abcdef')).toBe(456);
            expect(tabIDFromPortName('background-789-fedcba9876543210')).toBe(789);
        });
    });
});
