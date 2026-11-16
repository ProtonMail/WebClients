import { c } from 'ttag';

export const WasmUnsupportedError = () => {
    return (
        <div className="unsupported-browser-container text-center gap-4 p-6" role="alert">
            <h1 className="m-0 text-3xl text-semibold">{c('Title').t`Browser not supported`}</h1>
            <p className="m-0 color-weak">{c('Info').t`Update your browser or use another one.`}</p>
        </div>
    );
};
