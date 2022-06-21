# tsunami-evac-route

A webGIS to analyze tsunami evacuation route in The Special Region of Yogyakarta, Indonesia. The Webgis use PostgreSQL as database, PostGIS and PgRouting extention to support spatial data and Network Analysis Function

## Component
1. Web Introduction interface file are in ['/webintroduction'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction)
2. WebGIS interface file are in ['/webintroduction/webgis'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction/webgis)
3. Tsunami Evacuation Program are in ['/webintroduction/webgis/php'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction/webgis/php)
4. database file is in ['/webintroduction/webgis/php'](https://github.com/R-fadhil/tsunami-evac-route/tree/main/backup_database.rar)

## Component Inside Database
1. Tsunami Evacuation Shelter from [GITEWS](https://www.gitews.org/tsunami-kit/index_en.html) and OpenStreetMap
2. Tsunami Hazard Zone from [GITEWS](https://www.gitews.org/tsunami-kit/en/id_tsunami_hazard_map_diy.html)
3. Road Network downloaded from OpenStreetMap on 27 October 2021

## How to Set up
1. Put [interface and program](https://github.com/R-fadhil/tsunami-evac-route/tree/main/webintroduction) into server / localhost 
2. Install PHP, PostgreSQL, PostGIS extension, and PgROuting Extention into server / Localhost
3. restore the database to your server/Localhost
4. Open it through Web Browser

## Screenshot
### Mockup web introduction interface (left) and WebGIS Interfaces (right)

![screenshot](https://github.com/R-fadhil/tsunami-evac-route/blob/main/mockup.png)
