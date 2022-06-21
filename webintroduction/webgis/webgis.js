window.onload = function() {
  $('.page-loader').fadeOut();
  }

// turn off autoopen to stop dialog show up after the webgis loaded. 
// dialog will appear after user tried the webgis feature
$( document ).ready( function() {
$( '#dialog' ).dialog( { 'autoOpen': false} );
          });

/*Variable map*/      
var mymap = L.map('leaflet-js-map',{ zoomControl: false }).setView([-8.028080, 110.305599], 11);

/*wmts openstreetmap used for basemap*/
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

/*global variable declaration*/
//croshair variable that show up in the center of map
var crosshair;
//variabel start point route
var startMarker;
//variabel evacutation route
var shadowshortest_path;
var shortest_path;
//variabel to receive ajax respond
var ajaxdata;
var zona_bahaya;
var lokasi_esb;
//symbology for start point
var iconstartMarker = {
iconUrl: 'img2/start_marker.png',
iconAnchor:   [18, 18]
};

/*BEGIN GEOLOCATION BUTTON*/
//additional function when gps coordinate recorded
//mark gps location
function onLocationFound(e){
  if (mymap.hasLayer(startMarker)) {
    mymap.removeLayer(startMarker);
    startMarker = undefined;}
  startMarker = L.marker(e.latlng,{icon : L.icon( iconstartMarker )});
  //startMarker.properties = "input gps";
  startMarker.addTo(mymap);
}
mymap.on('locationfound', onLocationFound);

/*button to turnon gps*/
//function from leaflet locate control (plugin)
L.Control.locatestartmarker = L.Control.Locate.extend({
  //additional function to delete start point's mark and coordinate when gps turned off
  stop:function(){
    this._deactivate();
    this._cleanClasses();
    this._resetVariables();
    this._removeMarker();
    if (mymap.hasLayer(startMarker)){
    mymap.removeLayer(startMarker);
    startMarker = undefined;}
  }
});

/*add geolocation button to map*/ 
var lc = new L.Control.locatestartmarker({
    position: 'topright',
    drawCircle: false,
    drawMarker:false,
    showPopup: false,
    initialZoomLevel: 13,
    locateOptions: {enableHighAccuracy: true}
    });
mymap.addControl(lc);
/*END GEOLOCATION BUTTON*/

/*BEGIN "ADD START POINT MANUALLY" BUTTON*/
L.Control.STARTpointroute = L.Control.extend({
  options: {
  position: 'topright'
  },
  initialize: function(options) {
  L.Util.setOptions(this, options);
  },
    
  onAdd: function() {
    //BEGIN create "switch/toogle type" button using DOM
    //the first phase will show up "sign to move" marker
    //the second phase will mark start point
    this._map = mymap;
    var className = 'leaflet-control-startpoint',
    container = this._container = L.DomUtil.create('div', className);
    L.DomEvent.disableClickPropagation(container);
    var button = this._button = L.DomUtil.create('button', className );

    var showcrosshair = L.DomUtil.create('span', 'when-inactive');
    showcrosshair.textContent ='Pilih Lokasi Awal Rute';
    button.appendChild(showcrosshair);

    var marklocation = L.DomUtil.create('span', 'when-active');
    marklocation.textContent ='Okay';
    button.appendChild(marklocation);
    
    // event listener will run the first phase toogle/switch button
    $(function(){
      L.DomEvent.on(button, 'touchend', _crosshair);
      });
    
    //END create "switch/toogle type" button using DOM
    
    // BEGIN show up "sign to move" marker function (the first phase)  
    _crosshair = function() {
      //immediately turn off geolocation, delete the previous "start point & route"
      lc.stop();
      if (mymap.hasLayer(shortest_path )) {
        mymap.removeLayer(shadowshortest_path);
        mymap.removeLayer(shortest_path);
        shortest_path = undefined;
        shadowshortest_path = undefined;}
      if (mymap.hasLayer(startMarker)) {
        mymap.removeLayer(startMarker);
        startMarker = undefined;}  

      //"sign to move" marker 
      var crosshairIcon = L.icon({
        iconUrl: 'img2/crosshair.png',
        iconAnchor:   [74, 84]
      });

      //code to add "sign to move" marker to map
      crosshair =  L.marker(mymap.getCenter(), {icon: crosshairIcon, 
                                                clickable:false});
      crosshair.addTo(mymap);

      //code to keep "sign to move" marker at the center of map when user panning and zooming it
      mymap.on('move', function(e) {
        crosshair.setLatLng(mymap.getCenter());
      });

      //event listener to the second phase and turn off the first phase
      L.DomEvent.off(button, 'touchend', _crosshair);
      L.DomEvent.on(button, 'touchend', _marker);
      L.DomUtil.addClass(button, 'active');
    }
    // END show up "sign to move" marker function (the first phase) 
    
    // BEGIN function to mark start point (the second phase)
    _marker = function() {
      //turn off geolocation
      lc.stop();
      //remove "sign to move" marker
      if (crosshair != null) {
        mymap.removeLayer(crosshair);}
      
      //add start point marker to map
      startMarker = L.marker(mymap.getCenter(),
                    {icon : L.icon( iconstartMarker )});
      //startMarker.properties="input pengguna";
      startMarker.addTo(mymap);

      //event listener to the first phase and turn off the second phase
      L.DomEvent.on(button, 'touchend', _crosshair);
      L.DomEvent.off(button, 'touchend', _marker);
      L.DomUtil.removeClass(button, 'active');
    }
    // END function to mark start point (the second phase)

    container.appendChild(button);
    return button;
  }
});

/*add button to map*/ 
var startPointRoute = new L.Control.STARTpointroute();
mymap.addControl(startPointRoute);
/*END "ADD START POINT MANUALLY" BUTTON*/



/*BEGIN BUTTON TO RUN NEAREST FACILITY ANALYSIS*/
L.Control.FINDnearestshelter = L.Control.extend({
  options: {
  position: 'topright'
  },
  initialize: function(options) {
  L.Util.setOptions(this, options);
  },

  //create button using DOM 
  onAdd: function() {
    this._map = mymap;
    var className = 'leaflet-control-findshelter',
    container = this._container = L.DomUtil.create('div', className);
    L.DomEvent.disableClickPropagation(container);
    var button = this._button = L.DomUtil.create('input', className );
    button.type = 'submit';
    button.value ='Temukan Shelter Terdekat';

    //event listener for button (one click type to submit request into server) 
    $(function(){
      $('input.leaflet-control-findshelter').on('click', _findnearestshelter);
      });
    
    
    container.appendChild(button);
    return container;
  }
});



//add button into map
var findNearestShelter = new L.Control.FINDnearestshelter();
mymap.addControl(findNearestShelter);
/*END BUTTON TO RUN NEAREST FACILITY ANALYSIS*/

//function to send request of nearest facility analysis through ajax
_findnearestshelter = function(e) {
      e.preventDefault();
      if (startMarker == null) {
        alert(`Lokasi Awal Rute Belum Ditentukan`);}
      else{
        //ajax code send through POST method
        $.ajax({
          type: "POST",
          // start point coordinate which send into server
          data: {
            startlat: startMarker.getLatLng().lat,
            startlng: startMarker.getLatLng().lng
            //,sumber: startMarker.properties
            },
          cache: false,
          url: "php/find_nearest_shelter.php",
          dataType: "json",
          //show "loading" animation when start sned request
          beforeSend: function() {
            $("#route-loading").show();
            delete ajaxdata;
            if (mymap.hasLayer(shortest_path )) {
              mymap.removeLayer(shadowshortest_path);
              mymap.removeLayer(shortest_path);
              shortest_path = undefined;
              shadowshortest_path = undefined;}
            },
          //after success getting the server respond, automatically send the data to styling route's function
          success: _stylingRoute,
          //function when server failed to respond, it will show notification
          error: function() {           
            $("#route-loading").hide();
            alert('Gagal Memperoleh Respon Server');  
            },
          //turn off "loading" animation after ajax communication finished
          complete: function(){
            setTimeout(function(){$('#dialog').dialog('open');},2000);
            }   
        });
      }
    }

/*BEGIN STYLING RESPOND DATA (evacuation route)*/
//variable color and offset between route to avoid data cant be seen by user
var colorroutes = ['#ff0000', '#ff451a', '#ff9933', '#f1b422', '#f0f000', '#a1f61a', '#66ff33', '#1aff80', '#00ffff', '#99ccff', '#4462fc', '#8854ff', '#ca2bca'];
var offsetroutes = ['1','-1','3','-3','5','-5','7','-7','9','-9','10','-10','11']

//function to styling route
    _stylingRoute = function(result){
          ajaxdata = result;
          $("#route-loading").hide();
          //notification if user is still outside hazard zone
            if (ajaxdata == 'lokasi berada di luar zona bahaya') {
              alert('Anda Berada di Zona Aman. Pilih kembali Lokasi Awal Rute');
              }
            else{
              //input color and offset properties to each route following array sequence
              ajaxdata.features.forEach((feature, index) => {
                if (index < offsetroutes.length) feature.properties.offset = offsetroutes[index];
                    else feature.properties.offset = offsetroutes[offsetroutes.length - 1];
                if (index < colorroutes.length) feature.properties.color = colorroutes[index];
                    else feature.properties.color = colorroutes[colorroutes.length - 1];
                feature.geometry.coordinates.reverse();
                  });
              //add background route(dark color) since the basemap is light/bright/almost white
              shadowshortest_path = L.geoJSON(ajaxdata,{style: function(){return{color:"#515151",weight:'12'}}}).addTo(mymap);      
              shortest_path = L.geoJSON(ajaxdata,{style: styleroute,onEachFeature:addDistanceText}).addTo(mymap);
              mymap.fitBounds(shortest_path.getBounds());
              mymap.closePopup();
              
              //apply color and offset to route
              function styleroute(Feature) {
                return {
                  color: Feature.properties.color,
                  offset:Feature.properties.offset,
                  dashArray:[3],
                  weight:'2'};}
              
              //add distance information each route 
              function addDistanceText(Features, layer) {
                layer.bindTooltip('<h6 style="color:'+Features.properties.color+';">'+Features.properties.jarak_rute+' km</h6>',
                      {permanent:true});
                    }
            }}
/*END STYLING RESPOND DATA (evacuation route)*/

/*BEGIN REQUEST SHELTER DATA TO DATABASE*/  
$.ajax({
  type: "GET",
  url: "php/esb.php",
  dataType: "json", 
  success: function(esb) {
    lokasi_esb = L.geoJSON(esb,
                              {pointToLayer: pointToLayer,
                              onEachFeature: onEachFeature})
                      .addTo(mymap);
    }
});

//BEGIN "function to assign shelter symbol following shelter type information"
function pointToLayer(Feature){ 
  if (Feature.properties.jenis_shelter =='Tempat Pengungsian Sementara') {
    return L.marker((Feature.geometry.coordinates), 
                    {icon : L.icon({iconUrl: 'img2/marker1.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Tempat Pengungsian Akhir') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/marker2.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Titik Aman') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/marker3.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Titik Evakuasi Vertikal') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/marker4.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Sarana Ibadah') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/marker5.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Kantor Pemerintahan') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/marker6.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Lapangan') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/markera.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Layanan Kesehatan') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/markerb.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Perguruan Tinggi') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/markerc.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Pusat Komunitas') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/markerd.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Titik Kumpul') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/markere.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  else if (Feature.properties.jenis_shelter =='Terminal') {
    return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/markerf.png',
                                    iconAnchor:   [12, 35]
                                    })});}
  //symbol for last shelter shelter > school                                  
  else {return L.marker((Feature.geometry.coordinates),
                    {icon : L.icon({iconUrl: 'img2/marker7.png',
                                    iconAnchor:   [12, 35]
                                    })});}
}
//END "function to assign shelter symbol following shelter type information"
        
//BEGIN "function to add popup information in each shelter data 
//(it will show up if data marker clicked)"       
function onEachFeature(Feature, layer) {
  //record id shelter that user clicked
  var findid_shelter = Feature.properties.id;
  //content inside popup information (name, shelter type, and button to request shortest path analysis into choosen shelter)
  var findaroutebutton =`<b>${Feature.properties.nama_shelter}</b>
                        <pre>jenis :${Feature.properties.jenis_shelter}</pre>
                        <div class="d-flex"><button class="find-route-button btn btn-outline-info btn-sm">
                        Temukan Rute Terdekat</button></div>`;
  //put popup information into each shelter                
  layer.bindPopup(findaroutebutton, findid_shelter).on("popupopen", () => {
    //add event listener to button inside pop up information
    $("button.find-route-button.btn.btn-outline-info.btn-sm").on("click", e => {
      e.preventDefault();
      //notification if startpoint not inputted yet
      if (startMarker == null) {
        alert(`Lokasi Awal Rute Belum Ditentukan`);}
      else{
        //BEGIN AJAX function to send shortest path analysis request
        $.ajax({
          type: "POST",
          //data that used to analysis consist of start point coordinate and id shelter that clicked by user
          data: {
            startlat: startMarker.getLatLng().lat,
            startlng: startMarker.getLatLng().lng,
            idshelter: findid_shelter
            //,sumber: startMarker.properties
            },
          url: "php/find_nearest_path.php",
          dataType: "json",
          //function to show "loading" animation 
          beforeSend: function() {
            $("#route-loading").show();
            delete ajaxdata;
            if (mymap.hasLayer(shortest_path )) {
              mymap.removeLayer(shadowshortest_path);
              mymap.removeLayer(shortest_path);
              shortest_path = undefined;
              shadowshortest_path = undefined;}},
          //function to styling respond that received from database
          success: _stylingRoute,
          //fungsi if failed getting respond
          error: function() {
            alert('Gagal Memperoleh Respon Server');
            $("#route-loading").hide();
            },
          //function turn off loading animation when the request completed
          complete: function(){
            $("#route-loading").hide();
            setTimeout(function(){$('#dialog').dialog('open');},2000);
              return false;
            }   
      //END AJAX function to send shortest path analysis request
      });}
    });
  });
}
//END "function to add popup information in each shelter data 
/*END REQUEST SHELTER DATA TO DATABASE*/    

/*BEGIN REQUEST ZONE DATA TO DATABASE*/   
$.ajax({
  type: "GET",
  url: "php/zona_bahaya.php",
  dataType: "json", 
  success: function(zona) {
    zona_bahaya = L.geoJSON(zona, {style: _stylingZone}).addTo(mymap);
    }
});

//function to choose color zone depending to zone type
function getColor(d) {
  return d == '<3meter' ? '#FC4E2A' :
          d == '>3meter' ? '#FEB24C' :'#00FFFFFF'}

//function to apply color into data      
function _stylingZone(Feature) {
  return {
    fillColor: getColor(Feature.properties.zona),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.4};
}

//function to show symbol information (LEGEND)
const legend = L.control.Legend({
  title:"legenda",
  position: "bottomright",
  collapsed: true,
  symbolWidth: 80,
  symbolHeight:30,
  opacity: 0.9,
  legends: [
    {label: "Lokasi Awal Rute / Lokasi Pengguna",
    type: "image",
    url: "img2/start_marker.png"}
    ,{label: "Tempat Evakuasi Tsunami (Shelter)",
    type: "image",
    url: "img2/marker1.png"}
    ,
    {label: "Rute Terdekat"
    ,type:"withoutsymbol"},
    {label: "",
      type: "polyline",
      color: "#ff0000",
      dashArray: [3],
      weight: 2
    },
    {label: "",
      type: "polyline",
      color: "#ff451a",
      dashArray: [3],
      weight: 2
    },
    {label: "",
    type: "polyline",
    color: "#ff9933",
    dashArray: [3],
    weight: 2
    },
    {label: "",
    type: "polyline",
    color: "#f1b422",
    dashArray: [3],
    weight: 2
    },
    {label: "",
      type: "polyline",
      color: "#f0f000",
      dashArray: [3],
      weight: 2
    },           
    {label: "",
      type: "polyline",
      color: "#a1f61a",
      dashArray: [3],
      weight: 2
    },          
    {label: "",
      type: "polyline",
      color: "#66ff33",
      dashArray: [3],
      weight: 2
    },
    {label: "",
    type: "polyline",
    color: "#1aff80",
    dashArray: [3],
    weight: 2
    },
    {label: "",
      type: "polyline",
      color: "#00ffff",
      dashArray: [3],
      weight: 2
    },
    { label: "",
      type: "polyline",
      color: "#99ccff",
      dashArray: [3],
      weight: 2
    },
    { label: "",
      type: "polyline",
      color: "#4462fc",
      dashArray: [3],
      weight: 2
    },
    { label: "",
      type: "polyline",
      color: "#8854ff",
      dashArray: [3],
      weight: 2
    },
    { label: "",
      type: "polyline",
      color: "#ca2bca",
      dashArray: [3],
      weight: 2
    },
    {label: "Rute Terjauh"
    ,type:"withoutsymbol"},
    {label: "Zona Bahaya Gelombang Tsunami < 3 meter",
    type: "polygon",
    sides: 4,
    color: "#ffffff",
    dashArray: [3],
    fillColor: "#FC4E2A",
    weight: 2,
    fillOpacity:'0.7'},
    {label: "Zona Bahaya Gelombang Tsunami > 3 meter",
    type: "polygon",
    sides: 4,
    color: "#ffffff",
    dashArray: [3],
    fillColor: "#FEB24C",
    weight: 2,
    fillOpacity:'0.7'}]
  })
  .addTo(mymap);
  
/*END REQUEST ZONE DATA TO DATABASE*/     
