export const mergedCellsHTML = `<table>
  <tr>
    <td>1</td>
    <td>2</td>
    <td>3</td>
  </tr>
  <tr>
    <td>4</td>
    <td rowspan="2">5</td>
    <td>6</td>
  </tr>
  <tr>
    <td>7</td>
    <td>8</td>
  </tr>
  <tr>
    <td colspan="2">9</td>
    <td>10</td>
  </tr>
</table>`

export const TablesWithUnalignedRowsAndColumns = [
  `<table>
  <tr>
    <td>1</td>
    <td>2</td>
    <td>3</td>
  </tr>
  <tr>
    <td>4</td>
    <td rowspan="2">5</td>
    <td>6</td>
  </tr>
  <tr>
    <td>7</td>
    <td>8</td>
  </tr>
  <tr>
    <td colspan="2">9</td>
    <td>8</td>
    <td>10</td>
  </tr>
</table>`,
  `<table>
  <tr>
    <td>1</td>
    <td>3</td>
  </tr>
  <tr>
    <td>4</td>
    <td rowspan="2">5</td>
    <td>6</td>
  </tr>
  <tr>
    <td>7</td>
    <td>8</td>
  </tr>
  <tr>
    <td colspan="2">9</td>
    <td>10</td>
  </tr>
</table>`,
  `<table>
  <tr>
    <td>1</td>
    <td>3</td>
  </tr>
  <tr>
    <td>4</td>
    <td>5</td>
    <td>6</td>
  </tr>
  <tr>
    <td>7</td>
    <td>8</td>
  </tr>
  <tr>
    <td colspan="2">9</td>
    <td>10</td>
  </tr>
</table>`,
  `<table>
  <tr>
    <td>1</td>
    <td>3</td>
  </tr>
  <tr>
    <td>4</td>
  </tr>
  <tr>
    <td>7</td>
    <td>8</td>
  </tr>
  <tr>
    <td colspan="2">9</td>
    <td>10</td>
  </tr>
</table>`,
]
