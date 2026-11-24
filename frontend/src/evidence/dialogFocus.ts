export function getDialogKeyAction(key: string): 'close' | 'tab' | 'none' {
  if (key === 'Escape') return 'close'
  if (key === 'Tab') return 'tab'
  return 'none'
}

export function getFocusWrapIndex(activeIndex: number, itemCount: number, shiftKey: boolean): number | null {
  if (itemCount <= 0) return null
  if (shiftKey && activeIndex === 0) return itemCount - 1
  if (!shiftKey && activeIndex === itemCount - 1) return 0
  return null
}
