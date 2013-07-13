// step 1: make sure we have some type of otp.config, and otp.config.locale defined
if(typeof(otp) == "undefined" || otp == null) otp = {};
if(typeof(otp.config) == "undefined" || otp.config == null) otp.config = {};
//if(typeof(otp.config.locale) == "undefined" || otp.config.locale == null) otp.config.locale = otp.locale.English;


//otp.config.locale = otp.locale.French;
//otp.config.locale.config.metricsSystem = 'international';

// console.log(currentPosition.coords.latitude);
// console.log(currentPosition.coords.longitude);


// step 2: create an object of default otp.config default values (see step3 where we apply this to any existing config)
otp.config = {


    hostname : "http://localhost:3520/",
    routerId : "mtl",
    
    
    // default cloudmade tiles:
    // tileUrl : 'http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streetis/{z}/{x}/{y}.png',
    // tileAttrib : 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',

    // devseed tiles (DC only) & tile URL function override:
    //tileUrl : 'http://{s}.tiles.mapbox.com/v3/openplans.map-g4j0dszr,openplans.nyc_bike_overlay/{z}/{x}/{y}.png',
    tileUrl : 'http://a.tiles.mapbox.com/v3/asabbott.map-vvvfeozr/{z}/{x}/{y}.png',
    //overlayTileUrl : 'http://{s}.tiles.mapbox.com/v3/intertwine.nyc_bike_overlay/{z}/{x}/{y}.png',
    tileAttrib : 'Routing powered by <a href="http://opentripplanner.org/">OpenTripPlanner</a>, Map tiles from MapBox (<a href="http://mapbox.com/about/maps/">terms</a>) and OpenStreetMap ',
    initLatLng : new L.LatLng(41.875968, -87.624421),
    //initLatLng : null,
    initZoom : 14,
    minZoom : 12,
    maxZoom : 17,

    loggerUrl : this.hostname + 'cibi/log',
    dataStorageUrl : this.hostname + 'cibi/data', 
    
    CLASS_NAME : "otp.config"
};

var locale = otp.locale.English;

$("#about_link").html("meuh");

/*
// step 3: apply our default to the existing (possibly empty) otp config
try {
    otp.inherit(otp.config, otp.config_defaults);       // step 3a: build the object up
    otp.configure(otp.config, otp.config_defaults);     // step 3b: make sure any / all local changes above get applied
    console.log("otp.config updated with default items from otp.config_defaults");
} catch(e) {
    console.log("ERROR: was unable to run otp.inherit override in config.js - got this exception: " + e);
}*/
