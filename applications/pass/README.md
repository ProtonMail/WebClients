## Pass web-app

### Local development

```shell
yarn start-all --applications "proton-pass" --api proton.black
```

Make sure these entries are in your `/etc/hosts` file :

```
# Proton local-dev start
...
127.0.0.1 pass.proton.local
127.0.0.1 pass-api.proton.local
# Proton local-dev end
```

You can now access the pass web-app at `https://pass.proton.local` leveraging local SSO
