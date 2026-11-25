export function toFormData (data) {
  const form = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) form.append(key, value)
  }
  return form
}
