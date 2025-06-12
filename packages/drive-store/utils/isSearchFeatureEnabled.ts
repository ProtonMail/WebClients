import { getBrowser, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { Version } from '@proton/shared/lib/helpers/version';

export default function isSearchFeatureEnabled() {
    // Old Safari (<17) has several issues.
    // One: it is throttling a lot. First tens of items are done fast but
    // after ~ 500 items it goes very slowly and after ~ 2500 items it
    // basically stops without any progress.
    // Second: in some cases even if indexing finishes, sometimes search
    // doesnt work. Probably index is not created correctly. Its just few
    // reported cases and we haven't found the issue yet.
    // Because of that, its better to not allow search on Safari at all
    // until we find some way around it.
    if (isSafari()) {
        const browser = getBrowser();
        if (browser && browser.version) {
            return new Version(browser.version).isGreaterThanOrEqual('17') && !isMobile();
        }
        return false;
    }
    return !isMobile();
}
