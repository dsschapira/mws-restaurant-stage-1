/**
 * Register service worker
 */
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js')
    .then(function(reg){
        console.log("Service worker registered successful: ", reg.scope);
    })
    .catch(function(error){
        console.log('Service worker registration failed, error: ',error);
    });
  }