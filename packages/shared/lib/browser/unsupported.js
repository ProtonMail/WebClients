const showUnsupported = () => {
    document.body.innerHTML = `
<h1>Unsupported browser</h1>

<p>You are using an unsupported browser. Please update it to the latest version or use a different browser. <a href="https://protonmail.com/support/knowledge-base/browsers-supported/">More info</a>.</p>
`;
};

if (!window.protonSupportedBrowser) {
    showUnsupported();
}
