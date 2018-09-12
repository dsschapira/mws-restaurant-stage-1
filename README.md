# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1 - 3

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage One**, you will take a static design that lacks accessibility and convert the design to be responsive on different sized displays and accessible for screen reader use. You will also add a service worker to begin the process of creating a seamless offline experience for your users.

In **Stage Two**, restaurant data is now pulled from a server instead of a local .json file and saving data with IDB was added.  Accessibility was further improved upon as well.  Finally, a manifest.json file was added and the app is now able to be downloaded as a PWA when served over an https connection.

### Description & Specifications

This webapp shows a listing of restaurants with their geographic locations shown on a map.  The restaurants have related information and reviews.  All data is pulled asynchronously from a server.

After visitng, the webapp will be available offline and remain performant with a poor connection.  Additionally, the app is built with accesibility in mind and is fully responsive.

### How do I run this app?

1. A companion repository is needed to run this successfully.  First, clone the repo here [dsschapira - stage 3 companion repo](https://github.com/dsschapira/mws-restaurant-stage-3) and start it using the command `node server` from the project directory.

2. Next, in this  project's folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer. 

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

**NOTE**: I have Python 3.6.5 on my computer, and the command `python -m http.server 8000` works for me.  The `3` in the `python3 -m http.server 8000` may be unnecessary.

3. With your server running, visit the site: `http://localhost:8000`.

## Leaflet.js and Mapbox:

This repository uses [leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). You need to replace `<your MAPBOX API KEY HERE>` with a token from [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. 

### Note about ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write. 



