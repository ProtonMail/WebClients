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

If you want to target the production api, add set this env var `API_ENV=proton.me`

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

Make sure you have a ruby 4+. At the moment of writing, ruby 4.0.2, installed from `brew` works well. You can verify your ruby version with `ruby --version`

For the first time, run the build, install some dependencies and link the assets to the xcode project and open the `Proton Pass.xcodeproj` project for the first time

```shell
BUILD_TARGET=safari yarn build:extension && (cd safari && gem install xcodeproj && ruby ./tools/reference_dist_directory.rb && open "Proton Pass.xcodeproj")
```

Run the build from Xcode, in case of following error, select the team in Xcode:

> Signing for "Safari Extension" requires a development team. Select a development team in the Signing & Capabilities editor.

From this point on, run the following command for all code changes. This script will

- change the version in manifest-version.safari to YYYY.MMDD.HH format to make sure the new build is installed correctly
- build the extension
- run xcode build
- kill and reopen safari

```bash
sed -i '' -E "s/(\"version\": )\"[^\"]*\"/\1\"$(date +%Y.%m%d.%H%M)\"/" manifest-safari.json && BUILD_TARGET=safari yarn build:extension && (
  cd safari &&
  ruby ./tools/reference_dist_directory.rb &&
  xcodebuild \
    -project "Proton Pass.xcodeproj" \
    -scheme "Proton Pass" \
    -configuration Debug \
    -derivedDataPath ./build \
    build &&
  open "./build/Build/Products/Debug-maccatalyst/Proton Pass for Safari.app" &&
  pkill -x Safari &&
  open -a Safari
)
```

In case of error

> xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance

run

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcode-select -p # to verify, Should output /Applications/Xcode.app/Contents/Developer
```

Debugging extension components in Safari is challenging due to dev-tools limitations. For troubleshooting, build your project with the `HTTP_DEBUGGER=true` flag and launch the debugger interface using `yarn debugger:http`. This configuration will route all extension logs and error messages to stdout.

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
