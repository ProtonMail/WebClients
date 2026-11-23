import { Catalog } from './ComponentGallery';
import { ThemeStyles, scopeClass } from './ThemeScope';

export function UtilityExamples() {
    return (
        <>
            <ThemeStyles />
            <Catalog>
                {(appearance) => (
                    <div className="flex flex-column gap-2">
                        <span className="lumo-label-medium">{appearance === 'light' ? 'Light' : 'Dark'}</span>
                        <div className="flex flex-column gap-2 p-3 border lumo-border radius-12 lumo-bg-page">
                            <code>lumo-bg-page</code>
                            <div className="p-3 border lumo-border radius-8 lumo-bg-panel">
                                <code>lumo-bg-panel</code>
                            </div>
                            <div className="p-3 radius-8 lumo-bg-notice">
                                <code>lumo-bg-notice</code>
                            </div>
                        </div>
                    </div>
                )}
            </Catalog>
            <div className={scopeClass('light')}>
                <div className="ds-demo-list">
                    {[4, 8, 12, 16, 28, 'full'].map((radius) => (
                        <div className="ds-demo" key={radius}>
                            <div className={`ds-demo__shape lumo-bg-control-brand-fill radius-${radius}`} />
                            <code>radius-{radius}</code>
                        </div>
                    ))}
                </div>
                <div className="ds-demo-list">
                    {[1, 2, 3, 4].map((level) => (
                        <div className="ds-demo" key={level}>
                            <div className={`ds-demo__elevation lumo-bg-panel radius-12 lumo-elevation-${level}`}>
                                {level}
                            </div>
                            <code>lumo-elevation-{level}</code>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
