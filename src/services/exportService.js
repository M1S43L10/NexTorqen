const csvEscape = (value) => {
  const text = String(value ?? '')
  if (/[",\n\r;]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function exportToCsv(filename, rows, columns) {
  const header = columns.map((column) => csvEscape(column.label)).join(';')
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = typeof column.value === 'function' ? column.value(row) : row[column.value]
        return csvEscape(value)
      })
      .join(';'),
  )

  const csv = [header, ...body].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
