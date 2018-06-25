const cacheName = "dss-restaurant-reviewer-v1";

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/css/styles.css',
                '/data/restaurants.json',
                '/js/',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/js/register.js'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    let cacheRequest = event.request;
    let requestUrl = new URL(event.request.url);

    if(event.request.url.indexOf('restaurant.html') > -1){
        cacheRequest = new Request('restaurant.html');
    }
    if(requestUrl.hostname !== "localhost"){
        event.request.mode = "no-cors";
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
                console.log("There was an error: ",error);
            })
        );
    });
}