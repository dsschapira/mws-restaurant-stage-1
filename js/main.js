let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoiZHNzY2hhcGlyYSIsImEiOiJjaml1Y245djcyMTdwM3F0OThwaWI5cDJyIn0.vhl9xKPJznl3ApCHEWf9cQ',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant=> {
    ul.append(createRestaurantHTML(restaurant));
  });
  attachIconEventListeners();
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.setAttribute('data-id',restaurant.id);

  if(restaurant.is_favorite != 'false' && (restaurant.is_favorite || restaurant.is_favorite == 'true')){
    //unfortunately, need to do a string check for true/false because of initial DB state
    li.classList.add('favorite');
  }

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.cardImgUrlForRestaurant(restaurant);
  image.alt = "Picture of "+restaurant.name; 
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('role','button');
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  const favorite = document.createElementNS('http://www.w3.org/2000/svg','svg');
  favorite.setAttribute('xmlns','http://www.w3.org/2000/svg');
  favorite.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
  favorite.setAttribute('aria-label','Mark restaurant as favorite');
  favorite.setAttribute('viewBox','0 0 100 100');
  favorite.setAttribute('width','100');
  favorite.setAttribute('height','100');
  favorite.setAttribute('role','button');
  
  const favoritePath = document.createElementNS("http://www.w3.org/2000/svg",'path');
  favoritePath.setAttribute('d','M 50 85 C 35,75 0, 0 50, 35 M 50 85 C  65, 75 100, 0 50, 35');
  favoritePath.setAttribute('stroke','#D68711');
  favoritePath.setAttribute('stroke-width', '2');
  favorite.append(favoritePath);
  li.append(favorite);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 

attachIconEventListeners = () => {
  const favoriteIconPaths = Array.prototype.slice.call(document.querySelectorAll('#restaurants-list li path'));
  
  favoriteIconPaths.forEach(icon => {
    icon.addEventListener('click', e => {
      const restaurantElement = e.target.parentNode.parentNode;
      const restaurantID = restaurantElement.getAttribute('data-id');
      const favStatus = restaurantElement.classList.toggle('favorite');

      DBHelper.updateFavoriteRestaurants(restaurantID, favStatus, (status) => {
        if(status !== 200){
          restaurantElement.classList.toggle('favorite'); //swap back to what it was if there was an error changing it
          console.warn('There was an error updating favorite restaurants. ',status);
        }
      });

      
    });
  });
}