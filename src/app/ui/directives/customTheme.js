/* @ngInject */
const customTheme = (AppModel, dispatchers, mailSettingsModel, organizationModel) => ({
    replace: true,
    template: '<style id="customTheme"></style>',
    link(scope, el) {
        const { on, unsubscribe } = dispatchers();
        const update = () => {
            const { isLoggedIn } = AppModel.query();

            if (isLoggedIn) {
                const { Theme: organizationTheme } = organizationModel.get() || {};
                const userTheme = mailSettingsModel.get('Theme');
                const isDarkMode = userTheme.startsWith('/* dark-mode');
                AppModel.set('darkmode', isDarkMode);

                const theme = isDarkMode
                    ? `/* dark-mode
                * Come to the Dark Mode, we have wookies
                */
               .pm-button {
                 color: #fff;
                 background-color: #262a33;
                 border-color: #505560;
                 border-color: var(--bordercolor-input, #dde6ec);
                 /* just to cancel examples  */ }
                 .pm-button:focus, .pm-button:hover, .pm-button.is-hover {
                   color: #fff;
                   background-color: rgba(0, 0, 0, 0.2); }
                 .pm-button:not(div):active, .pm-button.is-active {
                   background: rgba(0, 0, 0, 0.5); }
                 .pm-button[disabled], .pm-button.is-disabled {
                   opacity: .6;
                   background-color: #262a33;
                   color: rgba(238, 239, 241, 0.6);
                   border-color: rgba(238, 239, 241, 0.6);
                   pointer-events: none; }
                 .pm-button.is-hover:hover {
                   background-color: rgba(0, 0, 0, 0.2); }

               .pm-button-blueborder {
                 border-color: #788ee8;
                 color: #788ee8;
                 background-color: #262a33; }
                 .pm-button-blueborder:focus, .pm-button-blueborder:hover, .pm-button-blueborder:focus-within, .pm-button-blueborder.is-hover, .pm-button-blueborder:not(div):active, .pm-button-blueborder.is-active {
                   background: rgba(0, 0, 0, 0.2);
                   border-color: #788ee8;
                   color: #526ee0; }
                 .pm-button-blueborder:not(div):active, .pm-button-blueborder.is-active {
                   background: rgba(0, 0, 0, 0.5); }
                 .pm-button-blueborder[disabled], .pm-button-blueborder.is-disabled {
                   opacity: .6;
                   background-color: #262a33;
                   color: rgba(238, 239, 241, 0.6);
                   border-color: rgba(238, 239, 241, 0.6);
                   pointer-events: none; }

               .pv-button-greenborder {
                 border-color: #5fb364;
                 color: #5fb364;
                 background-color: #262a33; }
                 .pv-button-greenborder:focus, .pv-button-greenborder:hover, .pv-button-greenborder:focus-within, .pv-button-greenborder.is-hover, .pv-button-greenborder:active, .pv-button-greenborder.is-active {
                   background-color: rgba(0, 0, 0, 0.2);
                   border-color: #3e8447;
                   color: #3e8447; }
                 .pv-button-greenborder:not(div):active, .pv-button-greenborder.is-active {
                   background: rgba(0, 0, 0, 0.5); }
                 .pv-button-greenborder[disabled], .pv-button-greenborder.is-disabled {
                   opacity: .6;
                   background-color: #262a33;
                   color: rgba(238, 239, 241, 0.6);
                   border-color: rgba(238, 239, 241, 0.6);
                   pointer-events: none; }

               .pm-button-blue[disabled], .pm-button-blue.is-disabled,
               .pm-button.pm-button-blue[disabled],
               .pm-button.pm-button-blue.is-disabled,
               .pv-button-green[disabled],
               .pv-button-green.is-disabled,
               .pm-button.pv-button-green[disabled],
               .pm-button.pv-button-green.is-disabled {
                 opacity: .6;
                 background-color: #262a33;
                 color: rgba(238, 239, 241, 0.6);
                 border-color: rgba(238, 239, 241, 0.6);
                 pointer-events: none; }

               .pm-button--link:focus, .pm-button--link:hover, .pm-button--link:not(div):active, .pm-button--link:active,
               a:focus,
               a:hover,
               a:not(div):active,
               a:active, .link:focus, .link:hover, .link:not(div):active, .link:active,
               .pm-button.pm-button--link:focus,
               .pm-button.pm-button--link:hover,
               .pm-button.pm-button--link:not(div):active,
               .pm-button.pm-button--link:active {
                 color: currentColor; }

               .pm-button--link[disabled], .pm-button--link.is-disabled,
               a[disabled],
               a.is-disabled, .link[disabled], .link.is-disabled,
               .pm-button.pm-button--link[disabled],
               .pm-button.pm-button--link.is-disabled {
                 color: rgba(255, 255, 255, 0.5); }

               .pm-field[type="search"] {
                 background-image: url(/settings/assets/sprite-for-css-only.c7c581e3.svg#css-search-white); }

               .pm-field[disabled] {
                 color: rgba(255, 255, 255, 0.5);
                 opacity: .6; }

               select.pm-field {
                 background-image: url(/settings/assets/sprite-for-css-only.c7c581e3.svg#css-caret-white); }

               .pm-checkbox:indeterminate + .pm-checkbox-fakecheck {
                 background-image: url(/settings/assets/sprite-for-css-only.c7c581e3.svg#css-dash-white); }

               .pm-toggle-checkbox[aria-busy="true"] + .pm-toggle-label::before {
                 background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJsb2FkaW5nQW5pbWF0aW9uIGxvYWRpbmdBbmltYXRpb24tLXNtYWxsZXIiIHZpZXdCb3g9IjAgMCAyMCAyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj4KPHN0eWxlPgoubG9hZGluZ0FuaW1hdGlvbiB7CiAgYW5pbWF0aW9uOiBwcm90b25Sb3RhdGUgM3MgbGluZWFyIGluZmluaXRlOyB9CgpAa2V5ZnJhbWVzIHByb3RvblJvdGF0ZSB7CiAgMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGUoMCk7IH0KICAxMDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfQoKLmxvYWRpbmdBbmltYXRpb24tY2lyY2xlIHsKICBmaWxsOiB0cmFuc3BhcmVudDsKICBzdHJva2U6ICNmZmY7CiAgc3Ryb2tlLXdpZHRoOiA0OwogIHRyYW5zZm9ybS1vcmlnaW46IDUwJTsgfQoKLmxvYWRpbmdBbmltYXRpb24tb3JiaXQxLS1zbWFsbGVyIHsKICBhbmltYXRpb246IHByb3Rvbk9yYml0MS1zbWFsbGVyIDNzIGxpbmVhciBpbmZpbml0ZTsgfQoKLmxvYWRpbmdBbmltYXRpb24tb3JiaXQyLS1zbWFsbGVyIHsKICBhbmltYXRpb246IHByb3Rvbk9yYml0Mi1zbWFsbGVyIDNzIGxpbmVhciBpbmZpbml0ZTsgfQoKQGtleWZyYW1lcyBwcm90b25PcmJpdDEtc21hbGxlciB7CiAgMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGVYKDApOwogICAgc3Ryb2tlLXdpZHRoOiAxOyB9CiAgMjUlIHsKICAgIHN0cm9rZS13aWR0aDogMjsgfQogIDUwJSB7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0KICA3NSUgewogICAgc3Ryb2tlLXdpZHRoOiAyOyB9CiAgMTAwJSB7CiAgICB0cmFuc2Zvcm06IHJvdGF0ZVgoMzYwZGVnKTsKICAgIHN0cm9rZS13aWR0aDogMTsgfSB9CkBrZXlmcmFtZXMgcHJvdG9uT3JiaXQyLXNtYWxsZXIgewogIDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlWSgwKTsKICAgIHN0cm9rZS13aWR0aDogMTsgfQogIDI1JSB7CiAgICBzdHJva2Utd2lkdGg6IDI7IH0KICA1MCUgewogICAgc3Ryb2tlLXdpZHRoOiAxOyB9CiAgNzUlIHsKICAgIHN0cm9rZS13aWR0aDogMjsgfQogIDEwMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGVZKDM2MGRlZyk7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0gfQo8L3N0eWxlPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjgiIGNsYXNzPSJsb2FkaW5nQW5pbWF0aW9uLWNpcmNsZSBsb2FkaW5nQW5pbWF0aW9uLWNpcmNsZS0tc21hbGxlciBsb2FkaW5nQW5pbWF0aW9uLW9yYml0MS0tc21hbGxlciIgLz4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBjbGFzcz0ibG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUgbG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUtLXNtYWxsZXIgbG9hZGluZ0FuaW1hdGlvbi1vcmJpdDItLXNtYWxsZXIiIC8+Cjwvc3ZnPg==); }

               .pm-toggle-checkbox[disabled] + .pm-toggle-label {
                 background-color: transparent;
                 opacity: .6; }

               .searchbox-field[type="search"] {
                 background-image: none; }

               [aria-busy="true"] {
                 background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJsb2FkaW5nQW5pbWF0aW9uIGxvYWRpbmdBbmltYXRpb24tLXNtYWxsZXIiIHZpZXdCb3g9IjAgMCAyMCAyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj4KPHN0eWxlPgoubG9hZGluZ0FuaW1hdGlvbiB7CiAgYW5pbWF0aW9uOiBwcm90b25Sb3RhdGUgM3MgbGluZWFyIGluZmluaXRlOyB9CgpAa2V5ZnJhbWVzIHByb3RvblJvdGF0ZSB7CiAgMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGUoMCk7IH0KICAxMDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfQoKLmxvYWRpbmdBbmltYXRpb24tY2lyY2xlIHsKICBmaWxsOiB0cmFuc3BhcmVudDsKICBzdHJva2U6ICNmZmY7CiAgc3Ryb2tlLXdpZHRoOiA0OwogIHRyYW5zZm9ybS1vcmlnaW46IDUwJTsgfQoKLmxvYWRpbmdBbmltYXRpb24tb3JiaXQxLS1zbWFsbGVyIHsKICBhbmltYXRpb246IHByb3Rvbk9yYml0MS1zbWFsbGVyIDNzIGxpbmVhciBpbmZpbml0ZTsgfQoKLmxvYWRpbmdBbmltYXRpb24tb3JiaXQyLS1zbWFsbGVyIHsKICBhbmltYXRpb246IHByb3Rvbk9yYml0Mi1zbWFsbGVyIDNzIGxpbmVhciBpbmZpbml0ZTsgfQoKQGtleWZyYW1lcyBwcm90b25PcmJpdDEtc21hbGxlciB7CiAgMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGVYKDApOwogICAgc3Ryb2tlLXdpZHRoOiAxOyB9CiAgMjUlIHsKICAgIHN0cm9rZS13aWR0aDogMjsgfQogIDUwJSB7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0KICA3NSUgewogICAgc3Ryb2tlLXdpZHRoOiAyOyB9CiAgMTAwJSB7CiAgICB0cmFuc2Zvcm06IHJvdGF0ZVgoMzYwZGVnKTsKICAgIHN0cm9rZS13aWR0aDogMTsgfSB9CkBrZXlmcmFtZXMgcHJvdG9uT3JiaXQyLXNtYWxsZXIgewogIDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlWSgwKTsKICAgIHN0cm9rZS13aWR0aDogMTsgfQogIDI1JSB7CiAgICBzdHJva2Utd2lkdGg6IDI7IH0KICA1MCUgewogICAgc3Ryb2tlLXdpZHRoOiAxOyB9CiAgNzUlIHsKICAgIHN0cm9rZS13aWR0aDogMjsgfQogIDEwMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGVZKDM2MGRlZyk7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0gfQo8L3N0eWxlPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjgiIGNsYXNzPSJsb2FkaW5nQW5pbWF0aW9uLWNpcmNsZSBsb2FkaW5nQW5pbWF0aW9uLWNpcmNsZS0tc21hbGxlciBsb2FkaW5nQW5pbWF0aW9uLW9yYml0MS0tc21hbGxlciIgLz4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBjbGFzcz0ibG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUgbG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUtLXNtYWxsZXIgbG9hZGluZ0FuaW1hdGlvbi1vcmJpdDItLXNtYWxsZXIiIC8+Cjwvc3ZnPg==); }

               button[aria-busy="true"] {
                 background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJsb2FkaW5nQW5pbWF0aW9uIGxvYWRpbmdBbmltYXRpb24tLXNtYWxsZXIiIHZpZXdCb3g9IjAgMCAyMCAyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj4KPHN0eWxlPgoubG9hZGluZ0FuaW1hdGlvbiB7CiAgYW5pbWF0aW9uOiBwcm90b25Sb3RhdGUgM3MgbGluZWFyIGluZmluaXRlOyB9CgpAa2V5ZnJhbWVzIHByb3RvblJvdGF0ZSB7CiAgMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGUoMCk7IH0KICAxMDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfQoKLmxvYWRpbmdBbmltYXRpb24tY2lyY2xlIHsKICBmaWxsOiB0cmFuc3BhcmVudDsKICBzdHJva2U6IHJnYmEoMjU1LCAyNTUsIDI1NSwgLjgpOwogIHN0cm9rZS13aWR0aDogNDsKICB0cmFuc2Zvcm0tb3JpZ2luOiA1MCU7IH0KCi5sb2FkaW5nQW5pbWF0aW9uLW9yYml0MS0tc21hbGxlciB7CiAgYW5pbWF0aW9uOiBwcm90b25PcmJpdDEtc21hbGxlciAzcyBsaW5lYXIgaW5maW5pdGU7IH0KCi5sb2FkaW5nQW5pbWF0aW9uLW9yYml0Mi0tc21hbGxlciB7CiAgYW5pbWF0aW9uOiBwcm90b25PcmJpdDItc21hbGxlciAzcyBsaW5lYXIgaW5maW5pdGU7IH0KCkBrZXlmcmFtZXMgcHJvdG9uT3JiaXQxLXNtYWxsZXIgewogIDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlWCgwKTsKICAgIHN0cm9rZS13aWR0aDogMTsgfQogIDI1JSB7CiAgICBzdHJva2Utd2lkdGg6IDI7IH0KICA1MCUgewogICAgc3Ryb2tlLXdpZHRoOiAxOyB9CiAgNzUlIHsKICAgIHN0cm9rZS13aWR0aDogMjsgfQogIDEwMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGVYKDM2MGRlZyk7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0gfQpAa2V5ZnJhbWVzIHByb3Rvbk9yYml0Mi1zbWFsbGVyIHsKICAwJSB7CiAgICB0cmFuc2Zvcm06IHJvdGF0ZVkoMCk7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0KICAyNSUgewogICAgc3Ryb2tlLXdpZHRoOiAyOyB9CiAgNTAlIHsKICAgIHN0cm9rZS13aWR0aDogMTsgfQogIDc1JSB7CiAgICBzdHJva2Utd2lkdGg6IDI7IH0KICAxMDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlWSgzNjBkZWcpOwogICAgc3Ryb2tlLXdpZHRoOiAxOyB9IH0KPC9zdHlsZT4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBjbGFzcz0ibG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUgbG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUtLXNtYWxsZXIgbG9hZGluZ0FuaW1hdGlvbi1vcmJpdDEtLXNtYWxsZXIiIC8+CiAgPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iOCIgY2xhc3M9ImxvYWRpbmdBbmltYXRpb24tY2lyY2xlIGxvYWRpbmdBbmltYXRpb24tY2lyY2xlLS1zbWFsbGVyIGxvYWRpbmdBbmltYXRpb24tb3JiaXQyLS1zbWFsbGVyIiAvPgo8L3N2Zz4=); }

               td[aria-busy="true"] {
                 position: relative;
                 background-image: none; }
                 td[aria-busy="true"]::before {
                   background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJsb2FkaW5nQW5pbWF0aW9uIGxvYWRpbmdBbmltYXRpb24tLXNtYWxsZXIiIHZpZXdCb3g9IjAgMCAyMCAyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj4KPHN0eWxlPgoubG9hZGluZ0FuaW1hdGlvbiB7CiAgYW5pbWF0aW9uOiBwcm90b25Sb3RhdGUgM3MgbGluZWFyIGluZmluaXRlOyB9CgpAa2V5ZnJhbWVzIHByb3RvblJvdGF0ZSB7CiAgMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGUoMCk7IH0KICAxMDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfQoKLmxvYWRpbmdBbmltYXRpb24tY2lyY2xlIHsKICBmaWxsOiB0cmFuc3BhcmVudDsKICBzdHJva2U6ICNmZmY7CiAgc3Ryb2tlLXdpZHRoOiA0OwogIHRyYW5zZm9ybS1vcmlnaW46IDUwJTsgfQoKLmxvYWRpbmdBbmltYXRpb24tb3JiaXQxLS1zbWFsbGVyIHsKICBhbmltYXRpb246IHByb3Rvbk9yYml0MS1zbWFsbGVyIDNzIGxpbmVhciBpbmZpbml0ZTsgfQoKLmxvYWRpbmdBbmltYXRpb24tb3JiaXQyLS1zbWFsbGVyIHsKICBhbmltYXRpb246IHByb3Rvbk9yYml0Mi1zbWFsbGVyIDNzIGxpbmVhciBpbmZpbml0ZTsgfQoKQGtleWZyYW1lcyBwcm90b25PcmJpdDEtc21hbGxlciB7CiAgMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGVYKDApOwogICAgc3Ryb2tlLXdpZHRoOiAxOyB9CiAgMjUlIHsKICAgIHN0cm9rZS13aWR0aDogMjsgfQogIDUwJSB7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0KICA3NSUgewogICAgc3Ryb2tlLXdpZHRoOiAyOyB9CiAgMTAwJSB7CiAgICB0cmFuc2Zvcm06IHJvdGF0ZVgoMzYwZGVnKTsKICAgIHN0cm9rZS13aWR0aDogMTsgfSB9CkBrZXlmcmFtZXMgcHJvdG9uT3JiaXQyLXNtYWxsZXIgewogIDAlIHsKICAgIHRyYW5zZm9ybTogcm90YXRlWSgwKTsKICAgIHN0cm9rZS13aWR0aDogMTsgfQogIDI1JSB7CiAgICBzdHJva2Utd2lkdGg6IDI7IH0KICA1MCUgewogICAgc3Ryb2tlLXdpZHRoOiAxOyB9CiAgNzUlIHsKICAgIHN0cm9rZS13aWR0aDogMjsgfQogIDEwMCUgewogICAgdHJhbnNmb3JtOiByb3RhdGVZKDM2MGRlZyk7CiAgICBzdHJva2Utd2lkdGg6IDE7IH0gfQo8L3N0eWxlPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjgiIGNsYXNzPSJsb2FkaW5nQW5pbWF0aW9uLWNpcmNsZSBsb2FkaW5nQW5pbWF0aW9uLWNpcmNsZS0tc21hbGxlciBsb2FkaW5nQW5pbWF0aW9uLW9yYml0MS0tc21hbGxlciIgLz4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBjbGFzcz0ibG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUgbG9hZGluZ0FuaW1hdGlvbi1jaXJjbGUtLXNtYWxsZXIgbG9hZGluZ0FuaW1hdGlvbi1vcmJpdDItLXNtYWxsZXIiIC8+Cjwvc3ZnPg==); }

               details[open] > summary {
                 background-image: url(/settings/assets/sprite-for-css-only.c7c581e3.svg#css-caret-close-white); }

               summary {
                 background-image: url(/settings/assets/sprite-for-css-only.c7c581e3.svg#css-caret-white); }

               .fill-global-grey,
               .fill-black {
                 fill: #fff; }

               :root {
                 --bgcolor-item-column-list: #262a33;
                 --bgcolor-view-column-detail: #2e323d;
                 --bgcolor-main-area: #2e323d;
                 --bgcolor-subnav: #262a33;
                 --bgcolor-toolbar: #3c414e;
                 --color-subnav-link: #fff;
                 --color-main-area: #fff;
                 --fillcolor-icons: #fff;
                 --bgcolor-disabled-checkboxes-radios: #3c414e;
                 --bgcolor-item-column-active: #526ee0;
                 --bordercolor-input: #505560;
                 --bgcolor-input: #3c414e;
                 --color-input: #fff; }

               `
                    : userTheme;
                el[0].textContent = organizationTheme || theme || '';
            }
        };

        on('organizationChange', update);
        on('mailSettings', update);
        on('AppModel', update);

        on('logout', () => {
            el[0].textContent = '';
        });

        update();

        scope.$on('$destroy', unsubscribe);
    }
});
export default customTheme;
