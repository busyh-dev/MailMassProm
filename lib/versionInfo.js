import packageJson from '../package.json';

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version || '1.6.6';
export const COMMIT_SHA = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_COMMIT_SHA || '').substring(0, 7);

export const DISPLAY_VERSION = COMMIT_SHA 
  ? `v${APP_VERSION} (${COMMIT_SHA})` 
  : `v${APP_VERSION}`;

export const BUILD_INFO = {
  version: APP_VERSION,
  commit: COMMIT_SHA || 'dev',
  displayVersion: DISPLAY_VERSION,
  buildTime: new Date().toISOString()
};

export default DISPLAY_VERSION;
