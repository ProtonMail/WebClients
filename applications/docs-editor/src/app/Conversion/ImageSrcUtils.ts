export const isBase64Image = (value = '') =>
  (value.startsWith('data:image') || value.startsWith('data:application/octet-stream')) && value.includes(';base64')

export const isWebpImage = (value = '') => value.startsWith('data:image/webp;base64')
