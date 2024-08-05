# Web clients

This project is a monorepo hosting the proton web clients. It includes the web applications, their dependencies & shared modules as well as all tooling surrounding development of the web clients (as well as some additional miscellaneous things).

-   <img src="./applications/mail/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Mail</span>
-   <img src="./applications/calendar/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Calendar</span>
-   <img src="./applications/drive/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Drive</span>
-   <img src="./applications/account/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Account</span>
-   <img src="./applications/vpn-settings/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton VPN</span>
-   <img src="./applications/pass/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Pass</span>
-   <img src="./applications/wallet/src/favicon.svg" style="vertical-align: middle" height="20" width="20" /> <span style="vertical-align: middle; display: inline-block">Proton Wallet</span>

Technically, this monorepo is based on Yarn 3 & Yarn Workspaces, with unified versioning for all packages inside.

## Getting Started

You'll need to have the following environment to work with this project

-   Node.js LTS
-   Yarn 3
-   git

You can find more detailed version-constrains for Node.js and yarn in `package.json`.

```shell
# Clone the project
git clone https://github.com/ProtonMail/WebClients.git
git clone git@github.com:ProtonMail/WebClients.git

# Install all dependencies for the entire monorepo & symlink
# local dependents to one another
yarn install

# Run web clients by running proton-<package-name>
# Example: proton mail web client
yarn workspace proton-mail start
```

For additional details on how to interact with the monorepo, see the [yarn docs](https://yarnpkg.com/) for reference.

## Help us to translate the project

You can learn more about it on [our blog post](https://proton.me/blog/translation-community).

## License

The code and data files in this distribution are licensed under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. See https://www.gnu.org/licenses/ for a copy of this license.

See [LICENSE](LICENSE) file
