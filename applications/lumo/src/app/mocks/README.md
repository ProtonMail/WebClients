# Mock Service Worker (MSW) Setup

This directory contains the Mock Service Worker setup for local development for the chat generation endpoint. MSW allows us to intercept and mock API requests during development. All other API requests should work as expected.

## Usage

A toggle button is available in development mode at the top of the screen:

- 🟢 **ON** - Using mocked API responses
- 🔴 **OFF** - Using real backend responses

The toggle state persists across page reloads via localStorage.

## Mock Scenarios

Mock responses are defined in `handlers.ts`. Available scenarios:

```typescript
type ScenarioType = 'success' | 'error' | 'timeout' | 'weeklyLimit' | 'rejected';
```

Each scenario simulates different API behaviors:

- `success` - Fake successful response (default)
- `error` - Assitant generation error response
- `timeout` - Assitant generation timeout
- `rejected` - Assitant generation timeout
- `weeklyLimit` - Weekly limit exceeded error (may not work until /chat endpoint updated)

## Debugging

1. **Console Logs**: MSW logs all intercepted requests with the 🔶 emoji:

    ```
    🔶 Mock Handler: Request URL: https://...
    🔶 Mock Handler: Intercepted generation request
    🔶 Mock Handler: Using scenario: success
    ```

2. **Browser DevTools**:

    - Network tab: Mocked requests are marked with "MSW" in the Initiator column
    - Console tab: Look for logs with 🔶 prefix for MSW-related information
    - Application tab > Service Workers: You can inspect the MSW service worker

3. **Error Handling**:
    - Check the console for any MSW-related errors (prefixed with 🔶)
    - If the toggle doesn't work, try:
        1. Clearing browser cache
        2. Unregistering service workers (DevTools > Application > Service Workers)
        3. Reloading the page

## Adding New Mocks

1. Add new handlers in `handlers.ts`
2. Add new scenarios in `config.ts` by extending the `ScenarioType`
3. Follow the existing pattern:
    ```typescript
    export const handlers = [
        http.post('/api/endpoint', async ({ request }) => {
            // Log the request
            console.log('🔶 Mock Handler: Intercepted request', await request.json());

            // Get current scenario
            const scenario = mockConfig.getScenario();

            // Return mocked response based on scenario
            return scenarios[scenario]();
        }),
    ];
    ```

## Testing Different Scenarios

To test different error states or responses:

1. Use the browser console to change scenarios:

    ```javascript
    window.mockConfig.setScenario('error'); // Test error response
    window.mockConfig.setScenario('timeout'); // Test timeout scenario
    window.mockConfig.setScenario('success'); // Back to normal responses
    window.mockConfig.setScenario('rejected'); // Test rejected response
    ```

2. Check the console for confirmation:
    ```
    🔶 Mock Config: Scenario set to: error
    ```

## Common Issues

1. **Toggle not working**:

    - Clear browser cache
    - Unregister service workers
    - Reload the page

2. **Unexpected responses**:
    - Check current scenario in console: `window.mockConfig.getScenario()`
    - Verify handler matches the API endpoint
    - Check request payload matches expected format
