// Define a custom element once, even if another bundle already did.
//
// Home Assistant's app installs a scoped custom element registry polyfill. The card bundle is
// an extra module that loads in parallel with the app, so it can run first. An element defined
// before the polyfill lands in the native registry and throws "Illegal constructor" as soon as
// the polyfill patches the Lit base class that all our elements share. So elements are defined
// only after Home Assistant has defined its root element, which comes after the polyfill.
const HA_ROOTS = ["home-assistant", "hc-main"];

let haReady: Promise<unknown> | null = null;

function isHaReady(): boolean {
  return HA_ROOTS.some((name) => customElements.get(name) !== undefined);
}

export function define(name: string, element: CustomElementConstructor): void {
  const register = () => {
    if (!customElements.get(name)) customElements.define(name, element);
  };
  if (isHaReady()) {
    register();
    return;
  }
  haReady ??= Promise.race(HA_ROOTS.map((root) => customElements.whenDefined(root)));
  void haReady.then(register);
}
