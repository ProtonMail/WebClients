# <img src="../../applications/pass/src/favicon.svg" style="vertical-align: middle; margin-right: 5px;" height="25" width="25" /> <span style="vertical-align: middle; display: inline-block">Proton Pass Web Application</span>

## Local Development

### Setup

1. Set up local SSO: follow the instructions in `utilities/local-sso/README.md`

2. Start the application from the root directory:

    ```shell
    yarn start-all --applications "proton-pass" --api proton.black
    ```

3. Host configuration: The first run should add these entries to your `/etc/hosts` file:

    ```
    127.0.0.1 pass.proton.dev
    127.0.0.1 pass-api.proton.dev
    ```

4. You can now access the web app at https://pass.proton.dev using local SSO

### Troubleshooting

#### Webpack cache issues

If your changes aren't appearing, try clearing the webpack cache:

```shell
rm -rf applications/pass/node_modules/.cache
```

#### Haproxy issues

If still not seeing your changes, check if haproxy is serving staging instead of local:

1. Visit https://pass.proton.dev/assets/version.json to verify it points to your branch/commit
2. If not showing your local version:
    - Clean-up your `/etc/hosts` file
    - Remove all .pem files in `utilities/local-sso`
    - Re-install local-sso dependencies per instructions
