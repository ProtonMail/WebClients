import { Mock } from 'vitest';

export type MockedFunction<F extends (...args: any) => any> = Mock<Parameters<F>, ReturnType<F>>;
