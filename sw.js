const cacheName = "dss-restaurant-reviewer-v1";

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/manifest.json',
                '/css/styles.css',
                '/data/restaurants.json',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/js/register.js'
            ]);
        })
        .catch(error => {
            return;
            //console.log("There was an error: ",error);
        })
    );
});

self.addEventListener('fetch', event => {
    let cacheRequest = event.request;
    let requestUrl = new URL(event.request.url);

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
    if(requestUrl.hostname !== "localhost"){
        event.request.mode = "no-cors";
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
                    cache.put(request, fetchResponse.clone());
                    return fetchResponse;
                });
            })
            .catch(error => {
                return;
                //console.log("There was an error: ",error);
            })
        );
    });
}