import type { BasicChartSpec, ChartAggregateType, ChartData, ChartSpec, EmbeddedChart } from '@rowsncolumns/spreadsheet'
import omit from 'lodash/omit'

type ChartType = {
  name: string
  icon: JSX.Element
  spec: Partial<ChartSpec>
}

const clusteredColumn: ChartType = {
  name: 'Clustered Column',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path fill="#FF9F50" d="M18 28.5h8V47h-8zM50 33h8v14h-8z"></path>
      <path fill="#5083FB" d="M28.5 18h8v29h-8zM60.5 18h8v29h-8z"></path>
    </svg>
  ),
  spec: {
    chartType: 'bar',
    stackedType: 'UNSTACKED',
  },
}

const stackedColumn: ChartType = {
  name: 'Stacked column',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path fill="#5083FB" d="M23.5 18h8v10h-8z"></path>
      <path fill="#FF9F50" d="M23.5 28h8v19h-8z"></path>
      <path fill="#5083FB" d="M34 23.5h8V35h-8z"></path>
      <path fill="#FF9F50" d="M34 35h8v12h-8z"></path>
      <path fill="#5083FB" d="M44.5 28h8v10h-8z"></path>
      <path fill="#FF9F50" d="M44.5 38h8v9h-8z"></path>
      <path fill="#5083FB" d="M55 20.5h8V35h-8z"></path>
      <path fill="#FF9F50" d="M55 35h8v12h-8z"></path>
    </svg>
  ),
  spec: {
    chartType: 'bar',
    stackedType: 'STACKED',
  },
}

const COLUMN_CHART_TYPES: ChartType[] = [clusteredColumn, stackedColumn]

const line: ChartType = {
  name: 'Line',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path stroke="#5083FB" strokeWidth="1.333" d="m19 40.583 12-8.666 12 5L53 26.25l14-2"></path>
      <path
        fill="#D9E5FF"
        stroke="#5083FB"
        strokeWidth="0.667"
        d="M19 37.583a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334ZM67 21.583a2.667 2.667 0 1 1-.264.014zM43 33.583a2.667 2.667 0 1 1-2.667 2.667l.014-.264A2.666 2.666 0 0 1 43 33.583ZM53 23.583a2.667 2.667 0 1 1-.264.014zM31 29.583a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334Z"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'line',
    smooth: false,
  },
}

const stackedLine: ChartType = {
  name: 'Stacked line',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path
        stroke="#FF9F50"
        d="m25 29.75 7.544-5.868a3 3 0 0 1 3.123-.345l5.264 2.486a3 3 0 0 0 3.558-.76l4.776-5.572a3 3 0 0 1 3.067-.941l9.168 2.5"
      ></path>
      <path stroke="#5083FB" d="m25 46.75 9-6.5L43 44l7.5-8L61 34.5"></path>
      <path
        fill="#5487FF"
        d="M25 44.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5M61 32.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5M43 41.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5M50.5 33.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5M34 38.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5"
      ></path>
      <path
        fill="#FFC99E"
        stroke="#FF9F50"
        strokeWidth="0.5"
        d="M25 27.75a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM61.5 19.25a2 2 0 1 1-.197.01zM43 24.75a2 2 0 1 1-2 2l.01-.197A2 2 0 0 1 43 24.75ZM50.5 16.25a2 2 0 1 1-.197.01zM34 20.75a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'line',
    smooth: false,
    stackedType: 'STACKED',
  },
}

const smoothLine: ChartType = {
  name: 'Smooth line',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path
        stroke="#FF9F50"
        d="m16.75 46.25 11.932-16.13a3 3 0 0 1 3.871-.837l17.289 9.626a3 3 0 0 0 3.947-.946L69.25 15"
      ></path>
      <path
        stroke="#5083FB"
        d="m17 35.75 14.908-.864a4 4 0 0 1 3.604 1.842l6.104 9.568a4 4 0 0 0 5.06 1.475L72.5 35.75"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'line',
    smooth: true,
  },
}

const LINE_CHART_TYPES: ChartType[] = [line, stackedLine, smoothLine]

const _2DPie: ChartType = {
  name: '2D Pie',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path
        fill="#5083FB"
        d="M43.5 51.5c-2.495 0-4.966-.498-7.271-1.465a19 19 0 0 1-6.164-4.173 19.3 19.3 0 0 1-4.119-6.245 19.47 19.47 0 0 1 0-14.734 19.3 19.3 0 0 1 4.119-6.245 19 19 0 0 1 6.164-4.173A18.8 18.8 0 0 1 43.5 13v38.5"
      ></path>
      <path
        fill="#FF9F50"
        d="M43.5 13c3.758 0 7.431 1.129 10.556 3.244a19.2 19.2 0 0 1 6.998 8.64 19.5 19.5 0 0 1 1.08 11.121 19.33 19.33 0 0 1-5.199 9.857L43.5 32.25z"
      ></path>
      <path fill="#FFC99E" d="M56.935 45.862a19 19 0 0 1-6.164 4.173A18.8 18.8 0 0 1 43.5 51.5V32.25z"></path>
    </svg>
  ),
  spec: {
    chartType: 'pie',
    stackedType: 'UNSTACKED',
    radius: [0, '75%'],
  },
}

const doughnut: ChartType = {
  name: 'Doughnut',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path
        fill="#5083FB"
        d="M62.5 32c0 2.495-.498 4.966-1.465 7.271a19 19 0 0 1-4.173 6.164 19.3 19.3 0 0 1-6.245 4.119 19.47 19.47 0 0 1-14.734 0 19.3 19.3 0 0 1-6.245-4.119 19 19 0 0 1-4.173-6.164A18.8 18.8 0 0 1 24 32h5.775c0 1.747.349 3.476 1.026 5.09a13.3 13.3 0 0 0 2.92 4.314 13.5 13.5 0 0 0 4.372 2.884 13.63 13.63 0 0 0 10.314 0 13.5 13.5 0 0 0 4.371-2.883A13.3 13.3 0 0 0 55.7 37.09 13.2 13.2 0 0 0 56.725 32z"
      ></path>
      <path
        fill="#FFC99E"
        d="M34.01 15.332a19.47 19.47 0 0 1 11.969-2.14 19.34 19.34 0 0 1 10.88 5.37l-4.083 4.031a13.54 13.54 0 0 0-7.616-3.759 13.63 13.63 0 0 0-8.378 1.498z"
      ></path>
      <path
        fill="#FF9F50"
        d="M24 32c0-3.414.932-6.765 2.698-9.7a19.14 19.14 0 0 1 7.337-6.982l2.764 5.005a13.4 13.4 0 0 0-5.136 4.887A13.17 13.17 0 0 0 29.775 32z"
      ></path>
      <path
        fill="#FFE7D3"
        d="M56.862 18.565a19 19 0 0 1 4.173 6.164A18.8 18.8 0 0 1 62.5 32h-5.775a13.2 13.2 0 0 0-1.026-5.09 13.3 13.3 0 0 0-2.92-4.314z"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'pie',
    stackedType: 'STACKED',
    radius: ['40%', '70%'],
  },
}

const PIE_CHART_TYPES: ChartType[] = [_2DPie, doughnut]

const treemap: ChartType = {
  name: 'Treemap',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path
        fill="#5083FB"
        d="M22.5 17.5a.5.5 0 0 1 .5-.5h19a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5H23a.5.5 0 0 1-.5-.5z"
      ></path>
      <path
        fill="#FF9F50"
        d="M43.5 24.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5V46a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"
      ></path>
      <path
        fill="#C8D5FF"
        d="M54.5 24.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v14a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"
      ></path>
      <path
        fill="#D9E5FF"
        d="M22.5 33.5a.5.5 0 0 1 .5-.5h19a.5.5 0 0 1 .5.5V46a.5.5 0 0 1-.5.5H23a.5.5 0 0 1-.5-.5zM43.5 17.5a.5.5 0 0 1 .5-.5h20a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H44a.5.5 0 0 1-.5-.5z"
      ></path>
      <path
        fill="#FFC99E"
        d="M54.5 40.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5V46a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'treemap',
  },
}

const sunburst: ChartType = {
  name: 'Sunburst',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="87" height="64" fill="none" viewBox="0 0 87 64">
      <path
        fill="#FFC99E"
        d="M58.778 15.436a24.64 24.64 0 0 0-16.556-6.142l.078 6.888a17.75 17.75 0 0 1 11.927 4.425z"
      ></path>
      <path
        fill="#AEC6FF"
        d="M36.858 51.587a18.208 18.208 0 0 0 23.06-22.362 18.21 18.21 0 0 0-17.59-13.189l.026 5.463a12.745 12.745 0 0 1 12.658 14.686 12.747 12.747 0 0 1-16.487 10.2z"
      ></path>
      <path
        fill="#5083FB"
        d="M46.198 46.678a13.318 13.318 0 0 0-3.954-25.955l-.097 5.326a7.991 7.991 0 0 1 2.373 15.573z"
      ></path>
      <path
        fill="#FF9F50"
        d="M42.376 20.726A13.318 13.318 0 0 0 30.25 40.305l4.7-2.507a7.99 7.99 0 0 1 7.276-11.747z"
      ></path>
      <path
        fill="#FFC99E"
        d="M30.223 40.254a13.32 13.32 0 0 0 16.668 6.172l-1.956-4.955a7.99 7.99 0 0 1-10-3.703z"
      ></path>
    </svg>
  ),
  spec: {
    chartType: 'sunburst',
  },
}

const HIERARCHY_CHART_TYPES: ChartType[] = [treemap, sunburst]

export const CHART_TYPES: [string, ChartType[]][] = [
  ['Column', COLUMN_CHART_TYPES],
  ['Line', LINE_CHART_TYPES],
  ['Pie', PIE_CHART_TYPES],
  ['Hierarchy', HIERARCHY_CHART_TYPES],
]

export const AGGREGATE_OPTIONS: { label: string; value: ChartAggregateType }[] = [
  { label: 'Sum', value: 'SUM' },
  { label: 'Average', value: 'AVERAGE' },
  { label: 'Count', value: 'COUNT' },
  { label: 'Median', value: 'MEDIAN' },
  { label: 'Min', value: 'MIN' },
  { label: 'Max', value: 'MAX' },
]

export function getBaseChartSpecData(spec: Partial<ChartSpec>): Partial<ChartSpec> {
  return omit(spec, ...(['chartType', 'smooth', 'stackedType', 'radius'] satisfies (keyof BasicChartSpec)[]))
}

/**
 * Maps a generic ChartSpec object to a specific ChartType.
 *
 * This function is necessary because chart variations (e.g., smooth line vs. stacked line)
 * are defined by a combination of properties (`chartType`, `smooth`, `stackedType`) rather
 * than a single, unique identifier.
 *
 * Ideally, if each ChartType had a unique ID that was stored in the spec, this logic
 * could be replaced with a simple and direct lookup, making it more robust and easier
 * to extend.
 */
export function getChartTypeBySpec(spec: Partial<ChartSpec>): ChartType | undefined {
  switch (spec.chartType) {
    case 'line':
      if (spec.smooth) {
        return smoothLine
      }
      if (spec.stackedType === 'STACKED') {
        return stackedLine
      }
      return line

    case 'bar':
      if (spec.stackedType === 'STACKED') {
        return stackedColumn
      }
      return clusteredColumn

    case 'pie':
      if (spec.stackedType === 'STACKED') {
        return doughnut
      }
      return _2DPie

    case 'treemap':
      return treemap

    case 'sunburst':
      return sunburst

    default:
      return undefined
  }
}

export function getChartTypeByName(name: string): ChartType | undefined {
  for (const [, chartTypes] of CHART_TYPES) {
    for (const chartType of chartTypes) {
      if (chartType.name === name) {
        return chartType
      }
    }
  }
  return undefined
}

export function isBasicChartSpec(spec: EmbeddedChart['spec']): spec is EmbeddedChart['spec'] & BasicChartSpec {
  return ['bar', 'line', 'pie', 'area'].includes(spec.chartType)
}

export type ChartDataFormula = Omit<ChartData, 'sources'> & { sources: string[] }
