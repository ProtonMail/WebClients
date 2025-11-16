import type { ChartSpec } from '@rowsncolumns/spreadsheet'
import omit from 'lodash/omit'

export function getBaseChartSpecData(spec: Partial<ChartSpec>): Partial<ChartSpec> {
  return omit(spec, ...(['chartType', 'smooth', 'stackedType', 'radius'] satisfies (keyof ChartSpec)[]))
}

type ChartType = {
  name: string
  icon: JSX.Element
  spec: Partial<ChartSpec>
}

const line: ChartType = {
  name: 'Line',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <path stroke="#A16A4A" d="m25 35.5 9-6.5 9 3.75 7.5-8 10.5-1.5" />
      <path stroke="#D1CFCD" strokeWidth={0.5} d="M8.5 51.25H81" />
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth={0.5}
        d="M25 33.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM61 21.25a2 2 0 1 1-.197.01l.197-.01ZM43 30.25a2 2 0 1 1-2 2l.01-.197A2 2 0 0 1 43 30.25ZM50.5 22.75a2 2 0 1 1-.197.01l.197-.01ZM34 27.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      />
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <path stroke="#5E9C76" d="m25 26.25 9-7 9 4.25 7.5-8.75 11 3" />
      <path stroke="#A16A4A" d="m25 43.25 9-6.5 9 3.75 7.5-8L61 31" />
      <path stroke="#D1CFCD" strokeWidth={0.5} d="M8.5 51.25H81" />
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth={0.5}
        d="M25 41a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM61 29a2 2 0 1 1-.197.01L61 29ZM43 38a2 2 0 1 1-2 2l.01-.197A2 2 0 0 1 43 38ZM50.5 30.5a2 2 0 1 1-.197.01l.197-.01ZM34 35a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      />
      <path
        fill="#BAE0BD"
        stroke="#5E9C76"
        strokeWidth={0.5}
        d="M25 24.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM61.5 15.75a2 2 0 1 1-.197.01l.198-.01ZM43 21.25a2 2 0 1 1-2 2l.01-.197A2 2 0 0 1 43 21.25ZM50.5 12.75a2 2 0 1 1-.197.01l.198-.01ZM34 17.25a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
      />
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <path
        stroke="#5E9C76"
        d="m16.75 44 11.932-16.13a3 3 0 0 1 3.871-.837l17.289 9.626a3 3 0 0 0 3.947-.946L69.25 12.75"
      />
      <path
        stroke="#A16A4A"
        d="m17 33.5 14.908-.864a4 4 0 0 1 3.604 1.842l6.104 9.568a4 4 0 0 0 5.06 1.475L72.5 33.5"
      />
      <path stroke="#D1CFCD" strokeWidth={0.5} d="M8.5 51.25H81" />
    </svg>
  ),
  spec: {
    chartType: 'line',
    smooth: true,
  },
}

const LINE_CHART_TYPES: ChartType[] = [line, stackedLine, smoothLine]

const clusteredColumn: ChartType = {
  name: 'Clustered Column',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <path fill="#FFC49C" stroke="#A16A4A" d="M25.5 28.5V46h-7V28.5h7ZM57.5 33v13h-7V33h7Z" />
      <path fill="#BAE0BD" stroke="#5E9C76" d="M36 18v28h-7V18h7ZM68 18v28h-7V18h7Z" />
      <path stroke="#D1CFCD" strokeWidth={0.5} d="M8.5 51.25H81" />
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <path fill="#BAE0BD" stroke="#5E9C76" d="M31 18v8h-7v-8h7Z" />
      <path fill="#FFC49C" stroke="#A16A4A" d="M31 28v18h-7V28h7Z" />
      <path fill="#BAE0BD" stroke="#5E9C76" d="M41.5 23.5V33h-7v-9.5h7Z" />
      <path fill="#FFC49C" stroke="#A16A4A" d="M41.5 35v11h-7V35h7Z" />
      <path fill="#BAE0BD" stroke="#5E9C76" d="M52 28v8h-7v-8h7Z" />
      <path fill="#FFC49C" stroke="#A16A4A" d="M52 38v8h-7v-8h7Z" />
      <path fill="#BAE0BD" stroke="#5E9C76" d="M62.5 20.5V33h-7V20.5h7Z" />
      <path fill="#FFC49C" stroke="#A16A4A" d="M62.5 35v11h-7V35h7Z" />
      <path stroke="#D1CFCD" strokeWidth={0.5} d="M8.5 51.25H81" />
    </svg>
  ),
  spec: {
    chartType: 'bar',
    stackedType: 'STACKED',
  },
}

const COLUMN_CHART_TYPES: ChartType[] = [clusteredColumn, stackedColumn]

const _2DPie: ChartType = {
  name: '2D Pie',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <mask id="a" fill="#fff">
        <path d="M48.25 8c0-.276.224-.5.5-.494 2.423.063 4.816.576 7.058 1.516a19.735 19.735 0 0 1 6.407 4.336 20.018 20.018 0 0 1 4.282 6.488A20.217 20.217 0 0 1 67.994 27a.49.49 0 0 1-.494.5H48.75a.5.5 0 0 1-.5-.5V8Z" />
      </mask>
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth={2}
        d="M48.25 8c0-.276.224-.5.5-.494 2.423.063 4.816.576 7.058 1.516a19.735 19.735 0 0 1 6.407 4.336 20.018 20.018 0 0 1 4.282 6.488A20.217 20.217 0 0 1 67.994 27a.49.49 0 0 1-.494.5H48.75a.5.5 0 0 1-.5-.5V8Z"
        mask="url(#a)"
      />
      <mask id="b" width={40} height={41} x={23.5} y={11.5} fill="#000" maskUnits="userSpaceOnUse">
        <path fill="#fff" d="M23.5 11.5h40v41h-40z" />
        <path d="M62 31.75c.276 0 .5.224.494.5a19.425 19.425 0 0 1-3.196 10.195 19.055 19.055 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.924 18.924 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.486 19.486 0 0 1 1.081-11.122 19.198 19.198 0 0 1 6.998-8.639A18.829 18.829 0 0 1 43 12.507a.49.49 0 0 1 .5.493v18.25a.5.5 0 0 0 .5.5h18Z" />
      </mask>
      <path
        fill="#BAE0BD"
        d="M62 31.75c.276 0 .5.224.494.5a19.425 19.425 0 0 1-3.196 10.195 19.055 19.055 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.924 18.924 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.486 19.486 0 0 1 1.081-11.122 19.198 19.198 0 0 1 6.998-8.639A18.829 18.829 0 0 1 43 12.507a.49.49 0 0 1 .5.493v18.25a.5.5 0 0 0 .5.5h18Z"
      />
      <path
        stroke="#5E9C76"
        strokeWidth={2}
        d="M62 31.75c.276 0 .5.224.494.5a19.425 19.425 0 0 1-3.196 10.195 19.055 19.055 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.924 18.924 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.486 19.486 0 0 1 1.081-11.122 19.198 19.198 0 0 1 6.998-8.639A18.829 18.829 0 0 1 43 12.507a.49.49 0 0 1 .5.493v18.25a.5.5 0 0 0 .5.5h18Z"
        mask="url(#b)"
      />
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <mask id="a" fill="#fff">
        <path d="M47.25 10c0-.276.224-.5.5-.493 2.292.062 4.554.55 6.675 1.44a18.735 18.735 0 0 1 6.083 4.118 19.017 19.017 0 0 1 4.065 6.164A19.217 19.217 0 0 1 65.993 28a.49.49 0 0 1-.493.5h-8.833a.522.522 0 0 1-.513-.5 9.137 9.137 0 0 0-.665-2.958 9.046 9.046 0 0 0-1.933-2.932 8.91 8.91 0 0 0-2.893-1.958 8.816 8.816 0 0 0-2.913-.674.523.523 0 0 1-.5-.514V10Z" />
      </mask>
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth={2}
        d="M47.25 10c0-.276.224-.5.5-.493 2.292.062 4.554.55 6.675 1.44a18.735 18.735 0 0 1 6.083 4.118 19.017 19.017 0 0 1 4.065 6.164A19.217 19.217 0 0 1 65.993 28a.49.49 0 0 1-.493.5h-8.833a.522.522 0 0 1-.513-.5 9.137 9.137 0 0 0-.665-2.958 9.046 9.046 0 0 0-1.933-2.932 8.91 8.91 0 0 0-2.893-1.958 8.816 8.816 0 0 0-2.913-.674.523.523 0 0 1-.5-.514V10Z"
        mask="url(#a)"
      />
      <mask id="b" width={40} height={41} x={23.5} y={11.5} fill="#000" maskUnits="userSpaceOnUse">
        <path fill="#fff" d="M23.5 11.5h40v41h-40z" />
        <path d="M62 31.75c.276 0 .5.224.494.5a19.425 19.425 0 0 1-3.196 10.195 19.055 19.055 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.924 18.924 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.486 19.486 0 0 1 1.081-11.122 19.198 19.198 0 0 1 6.998-8.639A18.829 18.829 0 0 1 43 12.507a.49.49 0 0 1 .5.493v3.65c0 .277-.224.5-.5.51a14.282 14.282 0 0 0-7.506 2.451 14.56 14.56 0 0 0-5.307 6.552 14.779 14.779 0 0 0-.82 8.435 14.66 14.66 0 0 0 3.944 7.475 14.352 14.352 0 0 0 7.378 3.996c2.795.563 5.692.274 8.325-.83a14.452 14.452 0 0 0 6.467-5.378 14.732 14.732 0 0 0 2.42-7.611c.01-.276.233-.5.509-.5H62Z" />
      </mask>
      <path
        fill="#BAE0BD"
        d="M62 31.75c.276 0 .5.224.494.5a19.425 19.425 0 0 1-3.196 10.195 19.055 19.055 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.924 18.924 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.486 19.486 0 0 1 1.081-11.122 19.198 19.198 0 0 1 6.998-8.639A18.829 18.829 0 0 1 43 12.507a.49.49 0 0 1 .5.493v3.65c0 .277-.224.5-.5.51a14.282 14.282 0 0 0-7.506 2.451 14.56 14.56 0 0 0-5.307 6.552 14.779 14.779 0 0 0-.82 8.435 14.66 14.66 0 0 0 3.944 7.475 14.352 14.352 0 0 0 7.378 3.996c2.795.563 5.692.274 8.325-.83a14.452 14.452 0 0 0 6.467-5.378 14.732 14.732 0 0 0 2.42-7.611c.01-.276.233-.5.509-.5H62Z"
      />
      <path
        stroke="#5E9C76"
        strokeWidth={2}
        d="M62 31.75c.276 0 .5.224.494.5a19.425 19.425 0 0 1-3.196 10.195 19.055 19.055 0 0 1-8.527 7.09 18.77 18.77 0 0 1-10.978 1.095 18.924 18.924 0 0 1-9.728-5.268 19.33 19.33 0 0 1-5.2-9.857 19.486 19.486 0 0 1 1.081-11.122 19.198 19.198 0 0 1 6.998-8.639A18.829 18.829 0 0 1 43 12.507a.49.49 0 0 1 .5.493v3.65c0 .277-.224.5-.5.51a14.282 14.282 0 0 0-7.506 2.451 14.56 14.56 0 0 0-5.307 6.552 14.779 14.779 0 0 0-.82 8.435 14.66 14.66 0 0 0 3.944 7.475 14.352 14.352 0 0 0 7.378 3.996c2.795.563 5.692.274 8.325-.83a14.452 14.452 0 0 0 6.467-5.378 14.732 14.732 0 0 0 2.42-7.611c.01-.276.233-.5.509-.5H62Z"
        mask="url(#b)"
      />
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <path fill="#BAE0BD" stroke="#5E9C76" d="M42 17.5v14H23v-14h19ZM53 24.5V46h-9V24.5h9ZM64 24.5v14h-9v-14h9Z" />
      <path fill="#FFC49C" stroke="#A16A4A" d="M42 33.5V46H23V33.5h19ZM64 17.5v5H44v-5h20ZM64 40.5V46h-9v-5.5h9Z" />
    </svg>
  ),
  spec: {
    chartType: 'treemap',
    stackedType: 'UNSTACKED',
    radius: undefined,
  },
}

const sunburst: ChartType = {
  name: 'Sunburst',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 64" width={87} height={64} fill="none">
      <path
        stroke="#EAE7E4"
        d="M4 .5h79A3.5 3.5 0 0 1 86.5 4v56a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 60V4A3.5 3.5 0 0 1 4 .5Z"
      />
      <mask id="a" fill="#fff">
        <path d="M57.408 33.075c.274.033.471.281.43.554A14 14 0 1 1 33.03 22.8a.486.486 0 0 1 .698-.062l4.96 4.23c.21.18.233.495.07.718A6.48 6.48 0 1 0 50.36 32.75a.532.532 0 0 1 .574-.435l6.474.76Z" />
      </mask>
      <path
        fill="#BAE0BD"
        stroke="#5E9C76"
        strokeWidth={2}
        d="M57.408 33.075c.274.033.471.281.43.554A14 14 0 1 1 33.03 22.8a.486.486 0 0 1 .698-.062l4.96 4.23c.21.18.233.495.07.718A6.48 6.48 0 1 0 50.36 32.75a.532.532 0 0 1 .574-.435l6.474.76Z"
        mask="url(#a)"
      />
      <mask id="b" fill="#fff">
        <path d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 1 1-35.236-10.357.49.49 0 0 1 .685-.153l4.118 2.65c.232.149.298.458.158.695A13.103 13.103 0 1 0 57.094 32c.01-.276.233-.5.51-.5H62.5Z" />
      </mask>
      <path
        fill="#BAE0BD"
        stroke="#5E9C76"
        strokeWidth={2}
        d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 1 1-35.236-10.357.49.49 0 0 1 .685-.153l4.118 2.65c.232.149.298.458.158.695A13.103 13.103 0 1 0 57.094 32c.01-.276.233-.5.51-.5H62.5Z"
        mask="url(#b)"
      />
      <mask id="c" fill="#fff">
        <path d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 0 1-23.166 18.036.49.49 0 0 1-.364-.601l1.227-4.852a.515.515 0 0 1 .61-.371A12.995 12.995 0 0 0 56.986 32c.01-.276.233-.5.51-.5H62.5Z" />
      </mask>
      <path
        fill="#BAE0BD"
        stroke="#5E9C76"
        strokeWidth={2}
        d="M62.5 31.5c.276 0 .5.224.493.5a19 19 0 0 1-23.166 18.036.49.49 0 0 1-.364-.601l1.227-4.852a.515.515 0 0 1 .61-.371A12.995 12.995 0 0 0 56.986 32c.01-.276.233-.5.51-.5H62.5Z"
        mask="url(#c)"
      />
      <mask id="d" fill="#fff">
        <path d="M32.493 45.986a.49.49 0 0 1-.699.075A19 19 0 1 1 62.97 30.41a.49.49 0 0 1-.478.515l-4.926.153a.515.515 0 0 1-.525-.484 13.07 13.07 0 1 0-21.556 10.822c.21.18.246.493.074.71l-3.065 3.859Z" />
      </mask>
      <path
        fill="#BAE0BD"
        stroke="#5E9C76"
        strokeWidth={2}
        d="M32.493 45.986a.49.49 0 0 1-.699.075A19 19 0 1 1 62.97 30.41a.49.49 0 0 1-.478.515l-4.926.153a.515.515 0 0 1-.525-.484 13.07 13.07 0 1 0-21.556 10.822c.21.18.246.493.074.71l-3.065 3.859Z"
        mask="url(#d)"
      />
      <mask id="e" fill="#fff">
        <path d="M28.114 22.02a.49.49 0 0 1-.168-.683 19 19 0 0 1 22.664-7.65.49.49 0 0 1 .28.644l-1.853 4.617a.515.515 0 0 1-.653.287 13.024 13.024 0 0 0-15.304 5.166.515.515 0 0 1-.694.168l-4.272-2.55Z" />
      </mask>
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth={2}
        d="M28.114 22.02a.49.49 0 0 1-.168-.683 19 19 0 0 1 22.664-7.65.49.49 0 0 1 .28.644l-1.853 4.617a.515.515 0 0 1-.653.287 13.024 13.024 0 0 0-15.304 5.166.515.515 0 0 1-.694.168l-4.272-2.55Z"
        mask="url(#e)"
      />
      <mask id="f" fill="#fff">
        <path d="M49.74 13.913a.49.49 0 0 1 .63-.314 19 19 0 0 1 12.086 22.417.49.49 0 0 1-.608.353l-4.751-1.296a.515.515 0 0 1-.36-.617 13.075 13.075 0 0 0-8.207-15.222.515.515 0 0 1-.317-.639l1.528-4.682Z" />
      </mask>
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth={2}
        d="M49.74 13.913a.49.49 0 0 1 .63-.314 19 19 0 0 1 12.086 22.417.49.49 0 0 1-.608.353l-4.751-1.296a.515.515 0 0 1-.36-.617 13.075 13.075 0 0 0-8.207-15.222.515.515 0 0 1-.317-.639l1.528-4.682Z"
        mask="url(#f)"
      />
      <circle cx={44} cy={31.5} r={7} fill="#BAE0BD" stroke="#5E9C76" />
      <mask id="g" fill="#fff">
        <path d="M32.39 24.61a.486.486 0 0 1-.167-.68 14 14 0 0 1 25.422 10.705.487.487 0 0 1-.604.356l-6.266-1.677a.531.531 0 0 1-.372-.617 6.514 6.514 0 0 0-11.733-4.941.531.531 0 0 1-.701.165l-5.578-3.31Z" />
      </mask>
      <path
        fill="#FFC49C"
        stroke="#A16A4A"
        strokeWidth={2}
        d="M32.39 24.61a.486.486 0 0 1-.167-.68 14 14 0 0 1 25.422 10.705.487.487 0 0 1-.604.356l-6.266-1.677a.531.531 0 0 1-.372-.617 6.514 6.514 0 0 0-11.733-4.941.531.531 0 0 1-.701.165l-5.578-3.31Z"
        mask="url(#g)"
      />
    </svg>
  ),
  spec: {
    chartType: 'sunburst',
    stackedType: 'UNSTACKED',
    radius: undefined,
  },
}

const HIERARCHY_CHART_TYPES: ChartType[] = [treemap, sunburst]

export const CHART_TYPES: [string, ChartType[]][] = [
  ['Column', COLUMN_CHART_TYPES],
  ['Line', LINE_CHART_TYPES],
  ['Pie', PIE_CHART_TYPES],
  ['Hierarchy', HIERARCHY_CHART_TYPES],
]

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
