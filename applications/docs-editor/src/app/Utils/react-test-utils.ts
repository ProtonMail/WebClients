import * as React from 'react'
import * as ReactTestUtils from 'react-dom/test-utils'

// @ts-expect-error Required to use ReactTestUtils.act (https://react.dev/reference/react/act#error-the-current-testing-environment-is-not-configured-to-support-act)
global.IS_REACT_ACT_ENVIRONMENT = true

/**
 * React 19 moved act from react-dom/test-utils to react
 * https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-react-dom-test-utils
 */
export const act = 'act' in React ? (React.act as typeof ReactTestUtils.act) : ReactTestUtils.act
