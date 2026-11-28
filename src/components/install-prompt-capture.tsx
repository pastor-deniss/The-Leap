// Chrome can announce installability (beforeinstallprompt) before React has
// hydrated InstallPrompt, and the event never repeats. This runs in the HTML
// itself and parks the event on window.__leapInstall for InstallPrompt.
const CAPTURE = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__leapInstall=e;window.__leapInstallAt=Date.now()});`;

export function InstallPromptCapture() {
  return <script dangerouslySetInnerHTML={{ __html: CAPTURE }} />;
}
