## Pass web-app

### Local development

Make sure to install haproxy, on Mac it can be done via `brew install haproxy`, then run:

```shell
yarn start-all --applications "proton-pass" --api proton.black
```

It should add the following lines to your `/etc/hosts` file:

```
# Proton local-dev start
...
127.0.0.1 pass.proton.local
127.0.0.1 pass-api.proton.local
# Proton local-dev end
```

You can now access the pass web-app at `https://pass.proton.local` leveraging local SSO

### Troubleshooting

In case you don't see your modification, it's possible that haproxy is serving the black version and not the local one! You can check that by going to https://pass.proton.local/assets/version.json

If that's the case, make sure

- remove all .pem files in utils/local-sso
- then reinstall bash haproxy mkcert, with brew it's `brew install bash haproxy mkcert`
