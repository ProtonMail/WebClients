import { ThemeStyles, scopeClass } from './ThemeScope';

export function UtilityExamples() {
    return (
        <>
            <ThemeStyles />
            <div className={scopeClass('light')}>
                <div className="ds-demo-list">
                    {[4, 8, 12, 16, 28, 'full'].map((radius) => (
                        <div className="ds-demo" key={radius}>
                            <div className={`ds-demo__shape lumo-bg-control-brand-fill lumo-radius-${radius}`} />
                            <code>lumo-radius-{radius}</code>
                        </div>
                    ))}
                </div>
                <div className="ds-demo-list">
                    {[1, 2, 3, 4].map((level) => (
                        <div className="ds-demo" key={level}>
                            <div className={`ds-demo__elevation lumo-bg-panel lumo-radius-12 lumo-elevation-${level}`}>
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
