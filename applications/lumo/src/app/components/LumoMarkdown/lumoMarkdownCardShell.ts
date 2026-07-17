/** Shared Proton design-system shell for Lumo markdown cards and Vega charts. */
export const LUMO_MARKDOWN_CARD_SHELL_CLASS =
    'bg-norm border border-weak rounded-xl shadow-norm w-full min-w-0';

/** Layout + card chrome shared by VegaChartLoading and VegaLiteChart for seamless stream transitions. */
export const LUMO_VEGA_CHART_SHELL_CLASS =
    `vega-lite-chart relative overflow-hidden p-4 my-2 mb-5 ${LUMO_MARKDOWN_CARD_SHELL_CLASS}`;

/** Stable React key for the trailing in-flight Vega chart while streaming completes. */
export const TRAILING_VEGA_CHART_KEY = 'vega-chart-trailing';
