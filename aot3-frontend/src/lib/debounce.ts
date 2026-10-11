export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): ((...args: Args) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const wrapped = (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
  };

  return wrapped;
}
