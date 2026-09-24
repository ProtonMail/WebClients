export function getHTMLElementFontSize(element: HTMLElement): number {
  return parseFloat(window.getComputedStyle(element).getPropertyValue('font-size'))
}
