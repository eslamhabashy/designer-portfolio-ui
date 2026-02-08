export function formatCount(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return ''
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)
    return `${formatted}M`
  }
  if (value >= 1_000) {
    const formatted = (value / 1_000).toFixed(value >= 100_000 ? 0 : 1)
    return `${formatted}k`
  }
  return String(value)
}
