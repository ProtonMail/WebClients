# Quickstart

### Environment variables

| Name                                | Values                            | Default                 | Dev only |
| ----------------------------------- | --------------------------------- | ----------------------- | -------- |
| **ENV**                             | `"development"` \| `"production"` | `"development"`         | ❌       |
| **BUILD_TARGET**                    | `"chrome"` \| `"firefox"`         | `"chrome"`              | ❌       |
| **RESUME_FALLBACK**<sup>1</sup>     | boolean                           | `ENV === "development"` | ✅       |
| **REDUX_DEVTOOLS_PORT**             | number                            | `8000`                  | ✅       |
| **WEBPACK_DEV_PORT**                | number                            | `8090`                  | ✅       |
| **RUNTIME_RELOAD**<sup>2</sup>      | boolean                           | `false`                 | ✅       |
| **RUNTIME_RELOAD_PORT**             | number                            | `8080`                  | ✅       |
| **HOT_MANIFEST_UPDATE**<sup>3</sup> | boolean                           | `false`                 | ✅       |

> <sup>1</sup> `RESUME_FALLBACK` allows by-passing SSL errors when using staging endpoints on extension start-up  
> <sup>2</sup> `RUNTIME_RELOAD` allows reloading the extension on code update  
> <sup>3</sup> `HOT_MANIFEST_UPDATE` will increment the extension version on code update

### Development

```bash
yarn start
yarn start:reload
```

> if the above commands fail, run `yarn workspace @proton/pass install:additional-tools`
