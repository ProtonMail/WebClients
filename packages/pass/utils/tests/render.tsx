import type { ReactNode } from 'react';

import { render as testingLibraryRender } from '@testing-library/react';

import { TestContext } from '@proton/pass/utils/tests/context';

export const render = (ui: ReactNode) => {
    return testingLibraryRender(<TestContext>{ui}</TestContext>);
};
