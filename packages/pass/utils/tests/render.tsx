import type { ReactNode } from 'react';

import { render as testingLibraryRender } from '@testing-library/react';

import { TestContext } from './context';

export const render = (ui: ReactNode) => {
    return testingLibraryRender(<TestContext>{ui}</TestContext>);
};
