import type { Mock } from 'vitest';

export type MockedFunction<F extends (...args: any) => any> = Mock<F>;
