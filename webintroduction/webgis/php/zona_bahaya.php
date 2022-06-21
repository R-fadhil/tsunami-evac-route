<?php

/* PROGRAM TO GET ZONE DATA FROM DATABASE */
/*default parameter to connect database */
$host = 'localhost';
$port = '5432';
$dbname = 'dbase_tsunami';
$user = 'postgres';
$password = 'postgres';

/*connection variable*/
$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");
if (!$conn) {
    echo "tidak terkoneksi" . pg_error();
    exit;
}

/*query sql variable*/
/*query to get zone data*/
$sql = "SELECT ST_AsGeoJSON(zona_bahaya.geom) AS geom_json,zona FROM zona_bahaya";

/*do querry and input analysis result into variable*/
$result = pg_query($conn,$sql);
if (!$result) {
    echo "gagal melakukan query.\n";
    exit;
}
pg_close($conn);
/*change query result into geojson format that supported by leaflet JS*/
$features=[];
while ($row = pg_fetch_array($result)) {
$feature=["type"=>"Feature","geometry"=>(json_decode($row[0])),"properties"=>["zona"=>$row[1]]];
array_push($features,$feature);}
$featureCollection=["type"=>"FeatureCollection", "features"=>$features];
echo json_encode($featureCollection);
?>