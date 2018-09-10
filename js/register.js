/**
 * Register service worker
 */
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js');

    //Setup one-off sync:
    navigator.serviceWorker.ready.then(swRegistration => {
        return swRegistration.sync.register('syncUpdates');
    });
  }