## Extension resources

-   [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/runtime/)
-   [Service Worker Lifecycle Reference](https://developer.chrome.com/docs/workbox/service-worker-lifecycle/)
-   [⚠️ Chrome Extension SW discussion](https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269)

## How to run the extension

Please note that all commands should be run from this directory, i.e. `applications/pass-extension`

On Mac, please first install `mkcert` with `brew install mkcert` (brew can be installed on https://brew.sh/) then:

```bash
yarn install
yarn install:devtools
```

If you want to create a build that targets the production environment, run `yarn start:prod`. `yarn start` targets the black environment by default.

After that, the build is available in `dist/` directory that you can install in Chromium by going to [extension page](chrome://extensions/), enable the developer mode, click on "Load Unpacked" and choose the `dist/` directory here.

## How to run the extension against localhost BE

As a prerequisite you need to have the backend running locally.

### Build the extension with the proper config

-   Edit `applications/pass-extension/src/app/config.ts` and set `export const API_URL = 'https://localhost:9090/api';`
-   Edit `applications/pass-extension/public/manifest.json` and set `externally_connectable` to

```
        "matches": ["https://*.proton.local/*", "https://*.proton.black/*", "https://*.proton.pink/*", "https://localhost/*", "http://localhost/*", "https://localhost:9090/*"]
```

-   Now the extension can be built by going to `applications/pass-extension` and running `yarn run start`

### Running the web account client locally

We need to run web account pointing to our local backend installation. From the root of this repository run:

```
yarn workspace proton-account start --api=https://localhost --port 8081
```

This will run the web account listening at port 8081 but chrome requires the extension to connect to sites with TLS enabled and the dev server for the web account doesn't support TLS. So we need to run something in front of it that will take care of the TLS termination and proxy the requests to the local web account. We can do that with [Caddy webserver](https://caddyserver.com/) in proxy mode. To do so, create a file called `Caddyfile` with the following contents:

```
{
	http_port 9080
}

https://localhost:9090 {
		reverse_proxy http://localhost:8081
		header Access-Control-Allow-Origin *
		header -Server
}
```

and run `caddy` from the directory where the file is. Caddy should generate automatically a cert and export https via port 9090. Requests sent there will be forwarded to the web account client.

Now you should be able to use the extension with your local backend installation.
