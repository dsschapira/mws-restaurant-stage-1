/**
 * Common database helper functions.
 */

// Values related to the function of the indexDb
const indexDB = {
  name: 'dss-restaurants-app',
  version: 1,
  stores: {
    restaurants: 'restaurants'
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
  });
}

class DBHelper {

  /**
   * Database URL.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurantsOnline(db, callback){
    fetch(DBHelper.DATABASE_URL)
      .then( response => response.json() )
      .then( restaurants => {
          if( db ){
            // Place data into Index DB before dispatching the callback if it exists
            const tx = db.transaction(indexDB.stores.restaurants, 'readwrite');
            const store = tx.objectStore(indexDB.stores.restaurants);
            restaurants.forEach( restaurant => {
              store.put(restaurant);
            });
          }
          callback(null, restaurants);
      })
      .catch( error => {
          const err = (`Request failed. Error returned: ${error}`);
          callback(err, null);
      });
  }

  static fetchRestaurants(callback) {

    const dbPromise = openIndexDatabase();

    dbPromise.then( db => {
      if(!db){ DBHelper.fetchRestaurantsOnline(false, callback); }
      else{ 
        db.transaction(indexDB.stores.restaurants).objectStore(indexDB.stores.restaurants).getAll().then( storeVals => {
          if ( storeVals.length == 0 ){
            // If it's first load, there's no point fetchin from IDB, go to online DB
            DBHelper.fetchRestaurantsOnline(db, callback); //gets data and stores to IDB
          }
          else {
            //Fetch from IDB then call out to server to update IDB
            const restaurants = db.transaction(indexDB.stores.restaurants).objectStore(indexDB.stores.restaurants);
            return restaurants.getAll().then( restaurantList => {
              callback(null, restaurantList);
              DBHelper.updateServerState(restaurantList); //send off updates to the server that were saved in IDB
            }).catch( error => {
              const err = (`Request failed. Error returned: ${error}`);
              callback(err, null);
            });
          }
        });
      }
    }).catch(err => {
      console.warn("There was an error opening IndexDB. Falling back to online DB.");
      DBHelper.fetchRestaurantsOnline(false, callback);
    });
  }

  /**
   * Fetch a restaurant by its ID.
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
    const url = `${DBHelper.DATABASE_URL}/${restaurantID}/?is_favorite=${status}`;

    // Update IDB before dispatching fetch. const dbPromise = openIndexDatabase();
    const dbPromise = openIndexDatabase();

    dbPromise.then( db => {
      const tx = db.transaction(indexDB.stores.restaurants, 'readwrite');
      const store = tx.objectStore(indexDB.stores.restaurants);

      store.get(parseInt(restaurantID)).then(restaurant => { 
        restaurant.is_favorite = status;
        store.put(restaurant)
        .then(()=>{
          console.log('got here...');
          cb(200);
        })
        .catch(err =>{
          cb(err);
        });
      });

    }).catch(err => {
      console.warn("There was an error opening IndexDB.");
      console.warn(err);
    });

    fetch(url, { method: 'PUT'})
      .then(response => {
        console.log(response);
      })
      .catch(err => {
        console.warn('There was an error updating the DB.. will attempt again on reconnect. ', err);
      });
  }

  static updateServerState(restaurants){
    //Update all favorites
    restaurants.forEach(restaurant => {
      const url = `${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`
      fetch(url, { method: 'PUT'})
    });
    //Also upload reviews
  }

}

