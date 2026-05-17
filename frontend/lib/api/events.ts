'use client'

const EVENT_NAME = 'artcontrol:data-changed'

export function emitDataChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function subscribeDataChanged(listener: () => void) {
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}
