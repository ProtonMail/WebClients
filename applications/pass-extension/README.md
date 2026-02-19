# <img src="../../applications/pass/src/favicon.svg" style="vertical-align: middle; margin-right: 5px;" height="25" width="25" /> <span style="vertical-align: middle; display: inline-block">Proton Pass Extension</span>

## Local Development

All commands should be run from the `applications/pass-extension` directory.

### Environment Variables

#### Build Target

The extension supports different browser targets:

- `BUILD_TARGET=chrome` - Build for Chromium browsers (default)
- `BUILD_TARGET=firefox` - Build for Firefox
- `BUILD_TARGET=safari` - Build for Safari

#### Development Variables

| Variable              | Purpose                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `RUNTIME_RELOAD`      | Enables automatic extension reloading in browser                          |
| `RUNTIME_RELOAD_PORT` | Port for the runtime reload server                                        |
| `WEBPACK_DEV_PORT`    | Port for webpack development server                                       |
| `REDUX_DEVTOOLS_PORT` | Port for Redux DevTools to connect on                                     |
| `RESUME_FALLBACK`     | Bypasses Chromium limitation when session resuming on staging             |
| `HOT_MANIFEST_UPDATE` | Bumps manifest version dynamically on hot-reload for testing update flows |
| `HTTP_DEBUGGER`       | Logger will report to debugger server                                     |

### Development Commands

```shell
yarn start # Development build without hot reloading
yarn start:reload # Development build with hot reloading
yarn start:prod # Development build using production config (no hot reloading)
```

In dev-mode, you can inspect the redux stores on the REDUX_DEVTOOLS_PORT (default: 8000) for the different extension components http://localhost:8000

## Building for Production

```bash
# Build for Chrome (default)
yarn build:extension

# Build for Firefox
BUILD_TARGET=firefox yarn build:extension

# Build for all platforms
yarn build:extension:all
```

### Loading Extensions

#### Chromium

1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load Unpacked" and select the `dist/` directory

#### Firefox

1. Go to about:debugging
2. Click "This Firefox"
3. Click "Load Temporary Add-on" and select `dist/manifest.json`
4. Configure permissions in extension management

#### Safari

> Hot-reloading is **unavailable** for safari extension development

```shell
BUILD_TARGET=safari yarn build:extension
cd safari && ruby ./tools/reference_dist_directory.rb
```

> Debugging extension components in Safari is challenging due to dev-tools limitations. For troubleshooting, build your project with the `HTTP_DEBUGGER=true` flag and launch the debugger interface using `yarn start http:debugger`. This configuration will route all extension logs and error messages to stdout.

Open the `Proton Pass.xcodeproj` project and run it

### Local Backend Integration

1. Configure the extension:

    - Set `API_URL = 'https://localhost:9090/api'` in `src/app/config.ts`
    - Update `externally_connectable.matches` to allow `localhost` in `public/manifest.json`

2. Run web account client:

    ```shell
    yarn workspace proton-account start --api=https://localhost --port 8081
    ```

3. Set up TLS termination with Caddy:

    Chrome requires TLS for extension connections. Create a `Caddyfile`:

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

    Run `caddy` from this directory to generate certificates and proxy requests from port 9090 to your local web account client.

## Resources

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/runtime/)
- [Service Worker Lifecycle Reference](https://developer.chrome.com/docs/workbox/service-worker-lifecycle/)
- [Chrome Extension SW discussion](https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269)
