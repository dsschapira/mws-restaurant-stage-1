const cacheName = "dss-restaurant-reviewer-v2";

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/manifest.json',
                '/css/styles.css',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/js/register.js'
            ]);
        })
        .catch(error => {
            return;
            console.log("There was an error installing the service worker: ",error);
        })
    );
});

self.addEventListener('fetch', event => {
    let cacheRequest = event.request;
    let requestUrl = new URL(event.request.url);

    if(requestUrl.hostname !== "localhost"){
        event.request.mode = "cors";
    }
    if(requestUrl.href.indexOf('leaflet.css') > -1){
        //add the integrity key if getting leaflet css
        event.request.integrity = "sha512-Rksm5RenBEKSKFjgI3a41vrjkw4EVPlJ3+OiI65vTjIdo9brlAacEuKOiQ5OFh7cOI1bkDwLqdLw3Zg0cRJAAQ=="
    }
    if(event.request.url.indexOf('restaurant.html') > -1){
        // Get rid of the ID url variable while ensuring we 
        // maintain all other request parameters
        const restaurantUrl = new Request('restaurant.html');
        const init = {};
        for (let key in restaurantUrl) {
            if(key == 'url'){
                init[key] = restaurantUrl.url;
            }
            else if(key == 'mode'){
                // A request cannot be created with a mode of "Navigate"
                init[key] = 'cors';
            }
            else{
                init[key] = cacheRequest[key];
            }
        }
        cacheRequest = new Request('restaurant.html', init);
    }
    if(event.request.url.indexOf('chrome-extension') > -1){
        return;
    }
    event.respondWith(serveRequest(cacheRequest));
});

function serveRequest(request){
    return caches.match(request).then(response => {
        return (
            response ||
            fetch(request).then(fetchResponse => {
                return caches.open(cacheName).then(cache => {
                    if(request.method == "GET"){
                        cache.put(request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            })
            .catch(error => {
                return;
                console.log("There was an error: ",error);
            })
        );
    });
}