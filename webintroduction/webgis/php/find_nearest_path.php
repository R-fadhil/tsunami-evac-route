<?php

/*PROGRAM OF SHORTEST EVACUATION PATH ANALYSIS USING USER DATA*/
/*default parameter to connect database*/
$host = 'localhost';
$port = '5432';
$dbname = 'dbase_tsunami';
$user = 'postgres';
$password = 'postgres';

/*start point coordinate from user*/
$startlat = $_POST['startlat'];
$startlng = $_POST['startlng'];
/*id shelter that user want to go there*/
$idshelter = $_POST['idshelter'];


/*connection variable*/
$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");
if (!$conn) {
    echo "tidak terkoneksi" . pg_error();
    exit;
}
/*first query sql variable*/
/*query to check if user(start point) in hazard zone or not*/
$sql1="SELECT ST_intersects((ST_SetSRID( ST_Point($startlng, $startlat),4326))
, zona_bahaya.geom) AS intersek
FROM zona_bahaya
order by intersek desc";

/*run the first query*/
$query1 = pg_query($conn,$sql1);
$check_location = pg_fetch_array($query1);

/*if user inside hazard zone (true/t), the query will continue to this one*/
if (in_array('t',$check_location)) {
 /*second query sql variable*/
 /*query shortest path analysis*/
$sql2 = "
--choose the closest vertex of road network from start point to become start vertices analysis
WITH startvertex as ( SELECT id
    FROM jalan_pesisir_diy_noded_vertices_pgr
    ORDER BY ST_Distance(jalan_pesisir_diy_noded_vertices_pgr.the_geom,		  
                      (ST_SetSRID( ST_Point($startlng, $startlat),4326))) LIMIT 1),

--query to get the closest vertex from the choosen shelter
destinyvertex as (
    SELECT array_agg(id_vertex_terdekat) AS id
    FROM lokasi_esb
    where id_esb= $idshelter)

--shortestpath analysis from the choosen vertices (destinyvertex and startvertex)
SELECT esb.id_esb,  round((sum(short_path.cost)/1000)::numeric,2) as jarak_rute,  ST_AsGeoJSON(st_collect(jln.geom)) AS geom_json 
FROM pgr_dijkstra('SELECT id, source, target, cost, reverse_cost FROM jalan_pesisir_diy_noded',
    (select id from startvertex) , (select id from destinyvertex))as short_path
    ,jalan_pesisir_diy_noded jln, lokasi_esb esb
where short_path.edge=jln.id and short_path.end_vid=esb.id_vertex_terdekat
group by esb.id_esb";
/*run the second query*/
$query2 = pg_query($conn,$sql2);
/*close database connection*/
pg_close($conn);

/*change query result into geojson format that supported by leaflet JS*/
$features=[];
while ($row = pg_fetch_array($query2)) {
$feature=["type"=>"Feature","geometry"=>(json_decode($row[2])),"properties"=>["jarak_rute"=>$row[1]]];
array_push($features,$feature);}
$featureCollection=["type"=>"FeatureCollection", "features"=>$features];
echo json_encode($featureCollection);

/*if user outside hazard zone, this program will send notification trigger*/
}else{
    echo (json_encode ( "lokasi berada di luar zona bahaya"));
}


?>