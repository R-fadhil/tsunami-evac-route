<?php

/* PROGRAM TO GET SHELTER DATA FROM DATABASE */
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
/*query to get data*/
$sql = "SELECT nama,ST_AsGeoJSON(ST_FlipCoordinates(lokasi_esb.geom)) AS geom_json, jenis_shelter, id_esb FROM lokasi_esb";

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
$feature=["type"=>"Feature","geometry"=>(json_decode($row[1])),"properties"=>["nama_shelter"=>$row[0],"jenis_shelter"=>$row[2],"id"=>$row[3]]];
array_push($features,$feature);}
$featureCollection=["type"=>"FeatureCollection", "features"=>$features];
echo json_encode($featureCollection);
?>