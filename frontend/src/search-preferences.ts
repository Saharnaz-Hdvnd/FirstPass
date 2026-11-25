export function trimSearchDescription(value: FormDataEntryValue | undefined) {
  return String(value ?? '').trim()
}

export function getResetPreferenceState() {
  return { description: '', summary: null }
}
