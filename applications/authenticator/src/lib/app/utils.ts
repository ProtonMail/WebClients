import { getAllWebviews } from '@tauri-apps/api/webview';

export const clearStorageAndReload = async () => {
    const webViews = await getAllWebviews();
    await Promise.all(webViews.map((webView) => webView.clearAllBrowsingData()));

    window.location.reload();
};

if (process.env.QA_BUILD) {
    const self = window as any;
    self['qa::logout'] = () => clearStorageAndReload();
}
