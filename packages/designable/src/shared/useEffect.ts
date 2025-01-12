import { onBeforeUnmount, watch } from 'vue-demi'
import type { WatchSource } from 'vue-demi'

export function useEffect(
  func: () => void | (() => void | null),
  dependency: WatchSource | WatchSource[]
) {
  const disposes = []

  watch(
    dependency,
    () => {
      disposes.forEach((fn) => fn?.())
      disposes.push(func())
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    disposes.forEach((fn) => fn?.())
  })
}
