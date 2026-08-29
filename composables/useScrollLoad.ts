const LOAD_DISTANCE = 80

export function isNearScrollTop(element: HTMLElement, distance = LOAD_DISTANCE) {
  return element.scrollTop <= distance
}

export function isNearScrollBottom(element: HTMLElement, distance = LOAD_DISTANCE) {
  return element.scrollTop + element.clientHeight >= element.scrollHeight - distance
}

interface ScrollLoadOptions {
  canLoadMore: () => boolean
  isScrollTrigger: (element: HTMLElement) => boolean
}

export function useScrollLoad(
  getElement: () => HTMLElement | null,
  load: () => Promise<void>,
  options: ScrollLoadOptions,
) {
  let loading = false

  async function tryLoad(requireScrollTrigger = true) {
    if (loading || !options.canLoadMore()) return

    const element = getElement()
    if (!element) return

    if (requireScrollTrigger && !options.isScrollTrigger(element)) return

    loading = true
    try {
      await load()
    } finally {
      loading = false
    }
  }

  async function ensureFilled(isUnderfilled: (element: HTMLElement) => boolean) {
    await nextTick()

    let guard = 0
    while (guard < 5 && options.canLoadMore()) {
      const element = getElement()
      if (!element || !isUnderfilled(element)) break

      guard += 1
      await tryLoad(false)
      await nextTick()
    }
  }

  function onScroll() {
    void tryLoad(true)
  }

  return {
    onScroll,
    tryLoad,
    ensureFilled,
  }
}
