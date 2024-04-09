# Chargebee iframe

This package wraps chargebee.js. It isn't meant to be directly imported in your code. Instead, it should be independently built to a single HTML file and hosted by the backend. The main web app like `account` or `mail` runs this package as an iframe.

See https://confluence.protontech.ch/display/PAY/Chargebee%3A+iframes and https://confluence.protontech.ch/display/PAY/Chargebee+client-side+integration

## Scripts

`yarn build` will create `dist/index.html` that can be used as the backend resource.

`yarn test` there are some tests in this package, so you can rely on them.

`yarn dev` will run the package locally and make it available on `https://localhost:5173`. That's right, **https**. It's needed for exchange of data between the host app and the iframe via `postMessage()` and for local debugging of some browser-related behaviors.

## Local development

Run `yarn dev` to make the app available on `https://localhost:5173`. Go to `packages/components/payments/chargebee/ChargebeeIframe.tsx` and modify `getIframeUrl()` function. It should have the local URL:

```
export function getIframeUrl() {
    return new URL('https://localhost:5173');
}
```

While this approach is simplistic, it's enough for the time being, because modifications in the chargebee package don't happen often.

## Message Bus

[message-bus.ts](./src/message-bus.ts) is a communication layer between the iframe content and the host application. It listens to the specified events and acts as a controller for the rest of the app. Many events work as RPC, and the host app expects a response event within a short time.

## CSP

We load the external script which requires changes in the CSP. We decided to use [nonce](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src) for `script` tag. The resulting dist/index.html file includes template keys `{nonce}` that backend dynamically replaces with the generated value. As a result, the response of `/payments/v5/forms/cards` contains the whitlisted nonce in the CSP header and the same nonce in the `<script>` tags.
