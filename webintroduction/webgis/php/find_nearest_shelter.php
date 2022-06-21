<?php

/*PROGRAM TO RUN NEAREST FACILITY ANALYSIS USING USER DATA*/
/*default parameter connection to database*/
$host = 'localhost';
$port = '5432';
$dbname = 'dbase_tsunami';
$user = 'postgres';
$password = 'postgres';

/* start point coordinate from user*/
$startlat = $_POST['startlat'];
$startlng = $_POST['startlng'];


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
$sql2="
    --select shelter that the distance is less than 10 km from start point
    WITH destinyvertex as(
        SELECT array_agg(id_vertex_terdekat) as id_vertex
        FROM lokasi_esb
        WHERE ST_Dwithin(ST_Transform(lokasi_esb.geom, 32749), 				  
                      ST_Transform((ST_SetSRID( ST_Point($startlng, $startlat),4326)),32749),10000)), 
                
                
    --look for the closest vertex in road network from start point
    startvertex as (
        SELECT id
        FROM jalan_pesisir_diy_noded_vertices_pgr
        ORDER BY ST_Distance(jalan_pesisir_diy_noded_vertices_pgr.the_geom, 				  
                      (ST_SetSRID( ST_Point($startlng, $startlat),4326))) LIMIT 1),

                
    --OD Cost Matrix from start point vertex (startvertex) to the choosen shelter (destinyvertex)
    measure_agregate_cost as(
        SELECT * FROM pgr_dijkstraCost(
            'SELECT id, source, target, cost, reverse_cost FROM jalan_pesisir_diy_noded',
            (select id from startvertex) , (select id_vertex from destinyvertex)), lokasi_esb 
        where lokasi_esb.id_vertex_terdekat=end_vid),

    --ordering/create sequence that ordered by cost(agg_cost) and grouped by shelter type(jenis_shelter)
    nearest_facility as(
        select id_esb, jenis_shelter, id_vertex_terdekat, agg_cost, rank() OVER (PARTITION BY jenis_shelter ORDER BY agg_cost asc) as urutan
        from measure_agregate_cost)

    --shortestpath analysis from startpoint to the most closest shelter (1 piece) in each shelter type
    SELECT esb.id_esb,  round((sum(short_path.cost)/1000)::numeric,2) as jarak_rute,  ST_AsGeoJSON(st_collect(jln.geom)) AS geom_json
    FROM pgr_dijkstra(
        'SELECT id, source, target, cost, reverse_cost FROM jalan_pesisir_diy_noded',
        (select id from startvertex) , (select array_agg(id_vertex_terdekat) FROM nearest_facility WHERE urutan = 1))as short_path
        ,jalan_pesisir_diy_noded jln,lokasi_esb esb
	where short_path.edge=jln.id and short_path.end_vid=esb.id_vertex_terdekat
    group by esb.id_esb
    order by jarak_rute asc";
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