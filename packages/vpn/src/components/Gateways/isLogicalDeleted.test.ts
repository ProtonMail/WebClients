import type { GatewayLogical, GatewayServer } from '../../types/Gateway';
import { isLogicalDeleted } from './isLogicalDeleted';

const server = (ID: string) => ({ ID }) as GatewayServer;

const logical = (Visible: boolean, Servers: GatewayServer[]) => ({ Visible, Servers }) as GatewayLogical;

describe('isLogicalDeleted', () => {
    it('returns true when the logical is hidden but still has servers', () => {
        expect(isLogicalDeleted(logical(false, [server('s1')]))).toBe(true);
    });

    it('returns false when the logical is visible, with or without servers', () => {
        expect(isLogicalDeleted(logical(true, [server('s1')]))).toBe(false);
        expect(isLogicalDeleted(logical(true, []))).toBe(false);
    });

    it('returns false when the logical is hidden with no servers, because it is still provisioning', () => {
        expect(isLogicalDeleted(logical(false, []))).toBe(false);
    });

    it('returns false when the logical has no Servers field at all', () => {
        expect(isLogicalDeleted({ Visible: false } as GatewayLogical)).toBe(false);
    });
});
