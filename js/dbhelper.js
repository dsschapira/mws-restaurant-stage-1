/**
 * Common database helper functions.
 */

// Values related to the function of the indexDb
const indexDB = {
  name: 'dss-restaurants-app',
  version: 1,
  stores: {
    restaurants: 'restaurants',
    reviews: 'reviews'
  }
};

function openIndexDatabase(){
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open(indexDB.name, indexDB.version, upgradeDB => {
    upgradeDB.createObjectStore(indexDB.stores.restaurants, { keyPath: 'id'});
    upgradeDB.createObjectStore(indexDB.stores.reviews, {keyPath: 'id', autoIncrement: true});
  });
}

class DBHelper {

  /**
   * Database URL.
   */
  static get RESTAURANT_DB_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEW_DB_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews`;
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchFromDB('restaurants', callback);
  }

  static fetchReviews(callback){
    DBHelper.fetchFromDB('reviews', callback);
  }

  static fetchFromOnline(type, db, callback) {
    const storeReference = (type == "restaurants" ? indexDB.stores.restaurants : (type == "reviews" ? indexDB.stores.reviews : false));
    const DB_Url = (type == "restaurants" ? DBHelper.RESTAURANT_DB_URL : (type == "reviews" ? DBHelper.REVIEW_DB_URL : false));

    if(!storeReference || !DB_Url){
      console.error("Invalid store type value: ", type);
    }

    fetch(DB_Url)
      .then( response => response.json() )
      .then( response_group => {
          if( db ){
            // Place data into Index DB before dispatching the callback if it exists
            const tx = db.transaction(storeReference, 'readwrite');
            const store = tx.objectStore(storeReference);
            response_group.forEach( response_item => {
              store.put(response_item);
            });
          }
          callback(null, response_group);
      })
      .catch( error => {
          const err = (`Request failed. Error returned: ${error}`);
          callback(err, null);
      });

  }

  static fetchFromDB(type, callback) {
    const dbPromise = openIndexDatabase();
    const storeReference = (type == "restaurants" ? indexDB.stores.restaurants : (type == "reviews" ? indexDB.stores.reviews : false));
    if(!storeReference){
      console.error("Invalid store type value: ", type);
    }

    dbPromise.then( db => {
      if(!db){ DBHelper.fetchFromOnline(type, false, callback); }
      else{ 
        db.transaction(storeReference).objectStore(storeReference).getAll().then( storeVals => {
          if ( storeVals.length == 0 ){
            // If it's first load, there's no point fetchin from IDB, go to online DB
            DBHelper.fetchFromOnline(type, db, callback); //gets data and stores to IDB
          }
          else {
            //Fetch from IDB then call out to server to update IDB
            const restaurants = db.transaction(storeReference).objectStore(storeReference);
            return restaurants.getAll().then( restaurantList => {
              callback(null, restaurantList);
            }).catch( error => {
              const err = (`Request failed. Error returned: ${error}`);
              callback(err, null);
            });
          }
        });
      }
    })
    .catch(err => {
      console.warn("There was an error opening IndexDB. Falling back to online DB.");
      DBHelper.fetchFromOnline(type, false, callback);
    });
    
  }

  /**
   * Fetch a restaurant and reviews by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  static fetchReviewsById(id, callback) {
    DBHelper.fetchReviews((error, reviews) => {
      if(error){
        callback(error, null);
      }
      else {
        const review_set = reviews.filter( review => review.restaurant_id === id );
        callback(null, review_set);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const img = restaurant.photograph ? restaurant.photograph : 'placeholder';
    return (`/img/${img}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 

  /**
   * Functions for updating
   */
  static updateFavoriteRestaurants(restaurantID, status, cb){
    const url = `${DBHelper.RESTAURANT_DB_URL}/${restaurantID}/?is_favorite=${status}`;

    // Update IDB before dispatching fetch. const dbPromise = openIndexDatabase();
    const dbPromise = openIndexDatabase();

    dbPromise.then( db => {
      const tx = db.transaction(indexDB.stores.restaurants, 'readwrite');
      const store = tx.objectStore(indexDB.stores.restaurants);

      store.get(parseInt(restaurantID)).then(restaurant => { 
        restaurant.is_favorite = status;
        store.put(restaurant)
        .then(()=>{
          cb(200);
        })
        .catch(err =>{
          cb(err);
        });
      });

      return tx.complete;

    }).catch(err => {
      console.warn("There was an error opening IndexDB.");
      console.warn(err);
    });

    fetch(url, { method: 'PUT'})
      .catch(err => {
        console.warn('There was an error updating the DB... will attempt again on reconnect. ', err);
      });
  }

  static postNewReview(review_data, cb){
    const url = `${DBHelper.REVIEW_DB_URL}/`;

    const dbPromise = openIndexDatabase();

    dbPromise.then( db => {
      const tx = db.transaction(indexDB.stores.reviews, 'readwrite');
      const store = tx.objectStore(indexDB.stores.reviews);

      store.add(review_data)
      .then(()=>{
        cb(200);
      })
      .catch((err)=>{
        cb(err);
      });

      return tx.complete;

    }).catch(err => {
      console.warn("There was an error opening IndexDB.");
      console.warn(err);
    });

    fetch(url, { method: 'POST', body: JSON.stringify(review_data) } )
      .catch(err => {
        console.warn('There was an error updating the DB... will attempt again on reconnect. ', err);
      });

  }

  static updateServerState(){
    //Update all favorites
    DBHelper.fetchRestaurants((err, restaurants) => {
      restaurants.forEach(restaurant => {
        const url = `${DBHelper.RESTAURANT_DB_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`
        fetch(url, { method: 'PUT'})
      });
    });
    //Also upload reviews
  }

}

