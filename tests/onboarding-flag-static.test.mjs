import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const appJs = read('js/app.js');
const loginHtml = read('login.html');

// tam_roi_onboarded is a bare localStorage flag, not scoped per account —
// it must be cleared on sign-out and on registering a new account, or a
// stale flag from a previous account on the same browser skips onboarding.
const signoutBlock = appJs.slice(appJs.indexOf("btn-signout"));
assert(signoutBlock.slice(0, 400).includes("removeItem('tam_roi_onboarded')"), 'sign-out must clear tam_roi_onboarded flag');

const registerBlock = loginHtml.slice(loginHtml.indexOf('async function handleRegister'));
assert(registerBlock.slice(0, 1200).includes("removeItem('tam_roi_onboarded')"), 'handleRegister must clear stale tam_roi_onboarded flag before redirecting');

console.log('onboarding-flag-static: OK');
