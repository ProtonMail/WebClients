# Adding new icons (or renaming an existing one)

Dear wanderer,

if you're reading this file then you might be as puzzled as I was. _Why I just added (or renamed) an icon and it is just being ignored by the build?_

Well, good news and bad news. I don't know _why_ pricesely it happens but I sure found a way to fix it, so probably will you. It's most likely one of the [hard problems in computer science](https://martinfowler.com/bliki/TwoHardThings.html) – cache. I expiremented with the code base with huge help of [ripgrep](https://github.com/BurntSushi/ripgrep) and [fd](https://github.com/sharkdp/fd) and found that deletion of certain folders and files helped me.

Couple of commands to consider:

```bash
rg --no-ignore "cc-visa" # outputs all entries of cc-visa string in the folder, including all the subfolders. --no-ignore makes sure that .gitignore files are also part of the search space.
fd -I node_modules # outputs all paths that include node_modules
```

The first natural reflex is just to delete the root `node_modules` – do it.

It didn't fix the problem for me but simplified the next steps. When I checked output of `rg` then I found that there are a bunch of files (mainly in different `dist` folders) that mention the icon names. I deleted all such folders – i.e. all gitignored (!) folders that contain mention of an icon name.

Then I checked the remaining `node_modules`:

```bash
> fd -I node_modules
applications/account/node_modules/
packages/i18n/node_modules/
packages/pack/node_modules/
utilities/version/node_modules/
```

I removed all the nested `node_modules` too.

After all of these operations, I simply ran `yarn install`. I hope that it will solve your problem too. If it did and you feel that you just saved a considerable amount of time, then you can find me (use `git blame` for good this time) and drop me a short message. It will positively reinforce me and I will probably write down other findings in the future to help the next wanderers.
