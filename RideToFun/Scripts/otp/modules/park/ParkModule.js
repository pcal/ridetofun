/* This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/

otp.namespace("otp.modules.park");


otp.modules.park.ParkModule = 
    otp.Class(otp.modules.Module, {

    moduleName  : "Park",
        
    startLatLng : null,
    endLatLng   : null,
    
    stations    : null,
    
    stationLookup :   { },
    
    markerLayer     : new L.LayerGroup(),
    pathLayer       : new L.LayerGroup(),
    stationsLayer   : new L.LayerGroup(),
    
    resultsWidget   : null,
    tipWidget       : null,
    tipStep         : 0,
    
    currentRequest  : null,

    triangleTimeFactor     : 0.333,
    triangleSlopeFactor    : 0.333,
    triangleSafetyFactor   : 0.334,
    
    aboutWidget		: null,
    contactWidget		: null,
    
    icons       : null,
                        
    initialize : function(webapp) {
        otp.modules.Module.prototype.initialize.apply(this, arguments);
                
        this.mapLayers.push(this.pathLayer);
        this.mapLayers.push(this.markerLayer);
        this.mapLayers.push(this.stationsLayer);

        this.icons = new otp.modules.park.IconFactory();
       
        this.initStations();

        var this_ = this;
        setInterval(function() {
            this_.updateStations();
        }, 30000);
        
        
        this.tipWidget = this.createWidget("otp-tipWidget", "");
        this.updateTipStep(1);
        
        this.createAboutInfo();
        this.bikestationsWidget = new otp.widgets.BikeStationsWidget('otp-bikestationsWidget');
        
    },



    
 
 
    
    getStations : function(start, end) {
        //console.log('stations '+start+' '+end);
        var tol = .0001, distTol = .01;
        var start_and_end_stations = [];
        
        for(var i=0; i<this.stations.length; i++) {
            var station = this.stations[i];
            //if(Math.abs(station.x - start.lng) < tol && Math.abs(station.y - start.lat) < tol) {
            //    // start station
            //    this.stationsLayer.removeLayer(station.marker);                        
            //    var marker = new L.Marker(station.marker.getLatLng(), {icon: this.icons.startBike});
            //    marker.bindPopup(this.constructStationInfo(locale.stationInfo.pickUpBike, station));
            //    this.stationsLayer.addLayer(marker);
            //    station.marker = marker;
            //    start_and_end_stations['start'] = station;
            //}
            //else if(this.distance(station.x, station.y, this.startLatLng.lng, this.startLatLng.lat) < distTol && 
            //        parseInt(station.bikesAvailable) > 0) {
            //    // start-adjacent station
            //    this.stationsLayer.removeLayer(station.marker);
                              
            //    var icon = this.distance(station.x, station.y, this.startLatLng.lng, this.startLatLng.lat) < distTol/2 ?  this.icons.getLarge(station) : this.icons.getMedium(station);
            //    var marker = new L.Marker(station.marker.getLatLng(), { icon: icon }); 
            //    marker.bindPopup(this.constructStationInfo(locale.stationInfo.alternatePickUp, station));
            //    this.stationsLayer.addLayer(marker);                        
            //    station.marker = marker;
            //}
            //else if(Math.abs(station.x - end.lng) < tol && Math.abs(station.y - end.lat) < tol) {
            //    // end station
            //    this.stationsLayer.removeLayer(station.marker);                        
            //    var marker = new L.Marker(station.marker.getLatLng(), {icon: this.icons.endBike});
            //    marker.bindPopup(this.constructStationInfo(locale.stationInfo.dropOffBike, station));
            //    this.stationsLayer.addLayer(marker);
            //    station.marker = marker;
            //    start_and_end_stations['end'] = station;
            //}
            //else if(this.distance(station.x, station.y, this.endLatLng.lng, this.endLatLng.lat) < distTol && 
            //        parseInt(station.bikesAvailable) > 0) {
            //    // end-adjacent station
            //    this.stationsLayer.removeLayer(station.marker);                        

            //    var icon = this.distance(station.x, station.y, this.endLatLng.lng, this.endLatLng.lat) < distTol/2 ?  this.icons.getLarge(station) : this.icons.getMedium(station);
            //    var marker = new L.Marker(station.marker.getLatLng(), {icon: icon}); 
            //    marker.bindPopup(this.constructStationInfo(locale.stationInfo.alternateDropOff, station));
            //    this.stationsLayer.addLayer(marker);                        
            //    station.marker = marker;
            //}
            //else {
                this.stationsLayer.removeLayer(station.marker);                        
                var marker = new L.Marker(station.marker.getLatLng(), {icon: this.icons.getSmall(station)}); 
                marker.bindPopup(this.constructStationInfo(locale.parkInfo.park, station));
                this.stationsLayer.addLayer(marker);                        
                station.marker = marker;
            //}
        }
        
        return start_and_end_stations;
    },
    
    
    initStations : function() {
        //console.log('init stations');
        var this_ = this;
        this.downloadStationData(function(stations) {
            this_.stations = stations;
            for(var i=0; i<this_.stations.length; i++) {
                var station = this_.stations[i];
                var marker = new L.Marker(new L.LatLng(station.y, station.x), {icon: this_.icons.getSmall(station)}); 
                marker.bindPopup(this_.constructStationInfo(locale.parkInfo.park, station));
                this_.stationsLayer.addLayer(marker);
                station.marker = marker;
                this_.stationLookup[station.id] = station;
            }
        });
    },

    updateStations : function(stations) {
        //console.log('update stations');
        var this_ = this;
        this.downloadStationData(function(newStations) {
            for(var i=0; i<newStations.length; i++) {
                var newStation = newStations[i];
                var station = this_.stationLookup[newStation.id];
                station.marker.bindPopup(this_.constructStationInfo(null, station)); 
            }    
        });
    },
    
    downloadStationData : function(callback) {
        var url = otp.config.hostname + 'Data/Parks';
        var this_ = this;
        var data_ = { };
        if(otp.config.routerId !== undefined) {
            data_ = { routerId : otp.config.routerId }
        }
        
        $.ajax(url, {
            data:       data_,
            dataType:   'jsonp',
                
            success: function(data) {
                //this_.stations = data.stations;
                callback(data);
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(textStatus, errorThrown);
            }
        });
    },
        
            
    constructStationInfo : function(title, station) {
        if(title == null) {
            title = (station.markerTitle !== undefined) ? station.markerTitle : locale.parkInfo.park;
        }
        var info = "<strong>"+title+"</strong><br/>";
        station.markerTitle = title;
        info += station.name+'<br/>';
        return info;
    },
    
    distance : function(x1, y1, x2, y2) {
        return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    },
    
    updateTipStep : function(step) {
        if (step <= this.tipStep) return;
        if(step == 1) this.tipWidget.setContent(locale.tipWidget.startPoint);
        if(step == 2) this.tipWidget.setContent(locale.tipWidget.endPoint);
        if(step == 3) this.tipWidget.setContent(locale.tipWidget.modifyTrip);
        
        this.tipStep = step;
    },
    
    createAboutInfo : function() {
        this.contactWidget = new otp.widgets.InfoWidget("otp-contactWidget");

        var contactCopy = locale.menu.contactText; 

        this.contactWidget.setContent("<p class='title'>"+ locale.menu.contact +"</p>" + contactCopy);
        this.contactWidget.hide();
        
        this.aboutWidget = new otp.widgets.InfoWidget("otp-aboutWidget");
        this.aboutWidget.setContent(locale.menu.aboutText);
        this.aboutWidget.hide();

    },
    
    hideSplash : function() {
        $("#splash-text").hide();
    },
    
    showAboutInfo : function() {
        this.aboutWidget.show();
        this.contactWidget.hide();
    },
    
    showContactInfo : function() {
        this.aboutWidget.hide();
        this.contactWidget.show();
    },
    
    CLASS_NAME : "otp.modules.park.ParkModule"
});


