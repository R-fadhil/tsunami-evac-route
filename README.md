# tsunami-evac-route

A webGIS to analyze tsunami evacuation route in The Special Region of Yogyakarta, Indonesia. The webGIS use PostgreSQL as database, PostGIS and PgRouting extention to support spatial data and Network Analysis Function

## How to Set up
1. Put [interface and program](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction) into server / localhost 
2. Install PHP, PostgreSQL, PostGIS extension, and PgRouting Extention into server / Localhost
3. restore the database to your server/Localhost
4. Open it through Web Browser

## Components
1. Web introduction interface file is in ['/webintroduction'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction)
2. WebGIS interface file is in ['/webintroduction/webgis'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction/webgis)
3. Tsunami evacuation program are in ['/webintroduction/webgis/php'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction/webgis/php)
4. database file is in ['/webintroduction/webgis/php'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/backup_database.rar)

## Components Inside Database
1. Tsunami evacuation shelter from [GITEWS](https://www.gitews.org/tsunami-kit/index_en.html) and OpenStreetMap
2. Tsunami hazard zone from [GITEWS](https://www.gitews.org/tsunami-kit/en/id_tsunami_hazard_map_diy.html)
3. Road network downloaded from OpenStreetMap on 27 October 2021

## Screenshot
#### Mockup web introduction interface (left) and WebGIS interfaces (right)

![screenshot](https://github.com/R-fadhil/tsunami-evac-route/blob/main/mockup.png)
