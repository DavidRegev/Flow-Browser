/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('flow.html', {
    id: 'main',
    bounds: { width: 414, height: 696 }
  });
});