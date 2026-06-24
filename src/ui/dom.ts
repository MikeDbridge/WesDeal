/** Tiny DOM helper — terse element creation without a framework. */

type Attrs = Record<string, string | number | boolean | EventListener>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else if (value !== false) {
      el.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

/** A small number input that yields `undefined` when left blank. */
export function numberInput(placeholder: string, min = 0, max = 99): HTMLInputElement {
  return h('input', {
    type: 'number',
    inputmode: 'numeric',
    min,
    max,
    placeholder,
    class: 'num',
  });
}

export function intOrUndefined(input: HTMLInputElement): number | undefined {
  const v = input.value.trim();
  if (v === '') return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

/** Like intOrUndefined but keeps decimals (e.g. for fractional K&R points). */
export function floatOrUndefined(input: HTMLInputElement): number | undefined {
  const v = input.value.trim();
  if (v === '') return undefined;
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? undefined : n;
}
