export const formatDate = (value) => {
  if (!value) return '-'
  const date = value?.toDate ? value.toDate() : new Date(value)
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
