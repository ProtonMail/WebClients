import { getChartTypeByName } from './chartData'

describe('chartData', () => {
  test.each(['Line', 'Smooth line'])('%s resets stacking', (name) => {
    expect(getChartTypeByName(name)?.spec).toMatchObject({
      chartType: 'line',
      stackedType: 'UNSTACKED',
    })
  })
})
