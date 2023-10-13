## Non regression testing

### Injection

-   ⚠ If the sites are multi-lang - choose english language for regression testing
-   ☑ Ensure that the injected icons are correctly positioned
-   ☑ Ensure that the dropdown is correctly positioned
-   ☑ Check that resizing the window doesn't break the layout
-   ☑ If field autofocused - dropdown should open (except if no logins matched | locked | logged-out)
-   ☑ If logged out : icon is in disabled state and asks for login
-   ☑ If locked out : icon is in locked state and asks for pin code
-   ☑ Updating settings should be immediate & not require reload

#### Login 🔑

-   [Proton 🟣 ](https://account.proton.me/switch)
-   [Proton ⚫️](https://account.proton.black/switch)
-   [Amazon](https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F%3Fref_%3Dnav_custrec_signin&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&) (misclassified)
-   [Google](https://accounts.google.com/InteractiveLogin/signinchooser)
-   [Paypal](https://www.paypal.com/signin)
-   [Reddit](https://www.reddit.com/login/)
-   [Reddit (Modal)](https://www.reddit.com/)
-   [Yahoo](https://login.yahoo.com/?.lang=en-US)
-   [Live](https://login.live.com/)
-   [Fandom](https://auth.fandom.com/signin)
-   [Semrush](https://www.semrush.com/login/)
-   [Dovetail](https://dovetailapp.com/auth/login/)
-   [Healthchecks](https://healthchecks.io/accounts/login/)
-   [Twitter](https://twitter.com/i/flow/login)
-   [Facebook](https://www.facebook.com)
-   [YCombinator](https://news.ycombinator.com/login)
-   [Europa (body reset)](https://webgate.ec.europa.eu/cas/login)
-   [Meetup](https://www.meetup.com/login/)
-   [Gitea (content-box)](https://try.gitea.io/user/login)
-   [Vrbo](https://www.vrbo.com/login?enable_login=true&redirectTo=%2Flogin)
-   [Vrbo ⓶](https://www.vrbo.com/auth/ui/login)
-   [Paddle](https://login.paddle.com/login)
-   [FranceTV (FR)](https://www.france.tv/inscription)
-   [Automic (animated)](https://investor.automic.com.au/#/home)

### Register 📝

-   [Proton 🟣 ](https://account.proton.me/signup)
-   [Proton ⚫️](https://account.proton.black/signup)
-   [Amazon](https://www.amazon.com/ap/register?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2F%3F_encoding%3DUTF8%26ref_%3Dnav_newcust&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&)
-   [Google](https://accounts.google.com/signup/v2/webcreateaccount?continue=https%3A%2F%2Fmyaccount.google.com%3Futm_source%3Daccount-marketing-page%26utm_medium%3Dcreate-account-button&flowName=GlifWebSignIn&flowEntry=SignUp&hl=en)
