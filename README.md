# Web clients

This project is a monorepo hosting the Proton web clients. It includes the web applications, their dependencies & shared modules as well as all tooling surrounding development of the web clients (as well as some additional miscellaneous things).

- <img src="./applications/mail/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Mail</span>
- <img src="./applications/calendar/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Calendar</span>
- <img src="./applications/drive/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Drive</span>
- <img src="./applications/account/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Account</span>
- <img src="./applications/vpn-settings/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton VPN</span>
- <img src="./applications/pass/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Pass</span>
- <img src="./applications/wallet/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Wallet</span>
- <img src="./applications/lumo/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Lumo</span>
- <img src="./applications/meet/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Meet</span>

Technically, this monorepo is based on pnpm & pnpm workspaces, with unified versioning for all packages inside.

## Getting Started

### Prerequisites

You'll need to have the following environment to work with this project:

- Node.js satisfying `engines.node` in the root `package.json` (a `.node-version` file is provided for fnm, mise, and similar tools, and a matching `.nvmrc` for nvm — keep both in sync)
- pnpm satisfying `engines.pnpm` in the root `package.json` (install with your preferred method, e.g. `npm install -g pnpm`)
- git

CI installs the exact pnpm version from the `packageManager` field; locally, any version that satisfies `engines.pnpm` is fine. Wrong package managers are rejected at install time (`preinstall`), and `engine-strict=true` in `.npmrc` makes `pnpm install` fail when Node or pnpm is below the declared floors.

### Installation

```shell
# Clone the project
git clone https://github.com/ProtonMail/WebClients.git
git clone git@github.com:ProtonMail/WebClients.git

# Install all dependencies for the entire monorepo & symlink
# local dependents to one another
pnpm install

# Run web clients by running proton-<package-name>
# Example: proton mail web client
pnpm --filter proton-mail run start
```

For additional details on how to interact with the monorepo, see the [pnpm docs](https://pnpm.io/) for reference.

### Shared dependency versions (catalog)

Every workspace declares the dependencies it imports. When many workspaces declare the same dependency and must stay on the same version, the range lives once in the `catalog:` section of [pnpm-workspace.yaml](pnpm-workspace.yaml), and each workspace references it with `"catalog:"` instead of a range:

```json
"devDependencies": {
    "@types/node": "catalog:"
}
```

Use `catalog:` when:

- the dependency is declared by several workspaces (as a rule of thumb, three or more), and
- they have to move together, for example the `@types` packages that `tsconfig.base.json` lists in `compilerOptions.types`, or a package where two versions in the tree would break things.

Declare a plain range instead when:

- only one or two workspaces use the dependency;
- a workspace deliberately needs a different version (for example `utilities/lumo-dev-proxy` keeps `@types/node@^22`);
- it's another workspace: use `workspace:^`;
- you need to pin a transitive dependency, for example for a security fix: use `overrides` in `pnpm-workspace.yaml`, since the catalog only applies to workspaces that reference it.

To add an entry, add the range to `catalog:` and switch every existing declaration of that dependency to `"catalog:"` in the same change. To bump it, change the range in `pnpm-workspace.yaml` only. Either way, run `pnpm install` and commit the updated `pnpm-lock.yaml` with it.

## How VPN app differs from the rest

VPN is present in both proton.me and protonvpn.com. However, they are served differently. Some parts of VPN are shared, hosted within `@proton/components` or `@proton/shared`, however, the entry points to them are different.

For protonvpn.com, the entry point comes from `applications/vpn-settings` and for account.proton.me/u/{X}/vpn, the entry point is `applications/account`.

Since both domains are separate, we don't share a local SSO between them. Therefore, we need to serve both applications separately:

```shell
# To serve VPN through vpn-settings
pnpm --filter proton-vpn-settings run start --port 8050

# To serve VPN through account
pnpm run start-all --applications "proton-account"
```

## How to version an application manually

While being on the `main` branch for a clean release.

From the root folder, run `pnpm --filter @proton/version run version --applications proton-X --version x.x.x.x`

## Help us to translate the project

You can learn more about it on [our blog post](https://proton.me/blog/translation-community).

## License

The code and data files in this distribution are licensed under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See https://www.gnu.org/licenses/ for a copy of this license.

See [LICENSE](LICENSE) file
