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

otp.namespace("otp.modules.bikeshare");


otp.modules.bikeshare.BikeShareModule = 
    otp.Class(otp.modules.Module, {

    moduleName  : "Bike Share",
        
    startLatLng : null,
    endLatLng   : null,
    
    stations    : null,
    
    stationLookup: {},
    stationMarkers: {},
    
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

        this.icons = new otp.modules.bikeshare.IconFactory();
       
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

    handleClick : function(event) {
        //console.log('bikeshare click at '+event.latlng.lat+", "+event.latlng.lng);
       
        this.hideSplash();
        
        if(this.startLatLng == null) {
            this.startLatLng = new L.LatLng(event.latlng.lat, event.latlng.lng);
            this.setStartPoint(this.startLatLng, true);
        }
        
        else if(this.endLatLng == null) {
            this.endLatLng = new L.LatLng(event.latlng.lat, event.latlng.lng);
            this.setEndPoint(this.endLatLng, true);
        }
    },
    
    trianglePlanTrip : function() {
        var triParams = this.resultsWidget.bikeTriangle.getFormData();
        this.triangleTimeFactor = triParams.triangleTimeFactor;
        this.triangleSlopeFactor = triParams.triangleSlopeFactor;
        this.triangleSafetyFactor = triParams.triangleSafetyFactor;
        this.planTrip();
    },
    
    setStartPoint : function(latlng, update) {
    
         var this_ = this;
         
         var start = new L.Marker(this.startLatLng, {icon: this.icons.startFlag, draggable: true}); 
         start.bindPopup('<strong>'+ locale.stationInfo.start +'</strong>');
         start.on('dragend', function() {
             this_.hideSplash();
             this_.startLatLng = start.getLatLng();
             this_.planTrip();
         });
         this.markerLayer.addLayer(start);
         
         if(update)
             this.updateTipStep(2);         
    },
    
    setEndPoint : function(latlng, update) {
         var this_ = this;
         
         var end = new L.Marker(this.endLatLng, {icon: this.icons.endFlag, draggable: true}); 
         end.bindPopup('<strong>'+ locale.stationInfo.destination +'</strong>');
         this.markerLayer.addLayer(end);
         end.on('dragend', function() {
             this_.hideSplash();
             this_.endLatLng = end.getLatLng();
             this_.planTrip();
         });
         
         if(update)
             this.planTrip();
   },
    
    
    planTrip : function(existingData, skipSave) {
        
        if(this.currentRequest !== null)
        {
            //console.log("Canceling current request.");
            this.currentRequest.abort();
            this.currentRequest = null;
        }
        
        this.pathLayer.clearLayers();
        
        
        // BEGIN: CLOUDMADE WORKING
        
        //var url = 'http://routes.cloudmade.com/bcd15929b0b547619417904ec26da9ba/api/0.3/';
        //this.pathLayer.clearLayers();        
        ////this.stationsLayer.clearLayers(); 
        
        //var this_ = this;
        
        //var data_ = null;
        
        ////if(existingData)
        ////    data_ = existingData;
        ////else
        ////{
        ////    var bikeType = $('input:radio[name=bikeType]:checked').val();
        ////    var mode = 'WALK,BICYCLE';
        ////    if(bikeType !== undefined)
        ////        mode = (bikeType == "shared_bike") ? 'WALK,BICYCLE' : 'BICYCLE';
        ////    data_ = {             
        ////        fromPlace: this.startLatLng.lat+','+this.startLatLng.lng,
        ////        toPlace: this.endLatLng.lat+','+this.endLatLng.lng,
        ////        mode: mode,
        ////        optimize: 'TRIANGLE',
        ////        bikeSpeed: 7.5,
        ////        triangleTimeFactor: this_.triangleTimeFactor,
        ////        triangleSlopeFactor: this_.triangleSlopeFactor,
        ////        triangleSafetyFactor: this_.triangleSafetyFactor
        ////    };
        ////    if(otp.config.routerId !== undefined) {
        ////        data_.routerId = otp.config.routerId;
        ////    }
        ////} 	

        //url += this.startLatLng.lat + ',' + this.startLatLng.lng + ',' + this.endLatLng.lat + ',' + this.endLatLng.lng;
        //url += '/bicycle.js';
        
        // END: CLOUDMADE WORKING

        // BEGIN: LOCAL
        
        var url = otp.config.hostname + 'Data/Directions/';
        
        var this_ = this;
        
        var data_ = {
            originLat: this.startLatLng.lat,
            originLong: this.startLatLng.lng,
            destLat: this.endLatLng.lat,
            destLong: this.endLatLng.lng
        };

        // END: LOCAL

        this.currentRequest = $.ajax(url, {
            data:       data_,
            dataType:   'jsonp',
                
            success: function(data) {
                
                //if(this_.resultsWidget == null) {
                //    this_.resultsWidget = new otp.widgets.TripSummaryWidget('otp-mainTSW', function() {
                //        this_.trianglePlanTrip();
                //    });
                //}
                
                //console.log(data);
                //var itin = data.plan.itineraries[0];
                //var resultsContent = '';
                //if(data.plan) {
                //    for(var i=0; i < itin.legs.length; i++) {
                //        var polyline = new L.EncodedPolyline(itin.legs[i].legGeometry.points);
                //        polyline.setStyle({ color : this_.getModeColor(itin.legs[i].mode), weight: 8});
                //        this_.pathLayer.addLayer(polyline);
                //        if(itin.legs[i].mode === 'BICYCLE') {
                //            polyline.bindPopup(locale.stationInfo.tripLine)
                //            var start_and_end_stations = this_.getStations(polyline.getLatLngs()[0], polyline.getLatLngs()[polyline.getLatLngs().length-1]);
                //        }
                        
                //        if(i == 0) {
                //            polyline.bindPopup(locale.stationInfo.walkToDock)
                //        }
                        
                //        if(i == 2) {
                //            polyline.bindPopup(locale.stationInfo.walkToDestination)
                //        }
                //    }
                //    this_.resultsWidget.updateMetrics(itin);
                //    this_.updateTipStep(3);

                //    if (start_and_end_stations !== undefined && data_.mode == 'WALK,BICYCLE') {                   
                //        this_.bikestationsWidget.setContentAndShow(start_and_end_stations['start'], start_and_end_stations['end']);
                //    }
                    
                //    if(!skipSave)
                //        this_.savePlan(data_);
                    
                //}
                //else {
                //    //this_.resultsWidget.noTripFound();
                //}
                


                // BEGIN CLOUDMADE WORKING
                //var point, route, points = [];
                //for (var i = 0; i < data.route_geometry.length; i++) {
                //    point = new L.LatLng(data.route_geometry[i][0], data.route_geometry[i][1]);
                //    points.push(point);
                //}
                
                //var polyline = new L.Polyline(points, {
                //    weight: 3,
                //    opacity: 0.5,
                //    color: '#0073e5',
                //    smoothFactor: 1
                //});
                //this_.pathLayer.addLayer(polyline);
                // END CLOUDMADE WORKING
                

                // BEGIN CUSTOM
                var point, route, points = [];
                for (var i = 0; i < data.originwalk.length; i++) {
                    point = new L.LatLng(data.originwalk[i].Latitude, data.originwalk[i].Longitude);
                    points.push(point);
                }

                var polyline = new L.Polyline(points, {
                    weight: 8,
                    opacity: 0.4,
                    color: '#2F9F00'
                });
                this_.pathLayer.addLayer(polyline);
                
                point, route, points = [];
                for (var i = 0; i < data.bike.length; i++) {
                    point = new L.LatLng(data.bike[i].Latitude, data.bike[i].Longitude);
                    points.push(point);
                }
                

                polyline = new L.Polyline(points, {
                    weight: 8,
                    opacity: 0.4,
                    color: '#0073e5'
                });
                var start_and_end_stations = this_.getStations(polyline.getLatLngs()[0], polyline.getLatLngs()[polyline.getLatLngs().length - 1]);
                this_.pathLayer.addLayer(polyline);
                
                point, route, points = [];
                for (var i = 0; i < data.destwalk.length; i++) {
                    point = new L.LatLng(data.destwalk[i].Latitude, data.destwalk[i].Longitude);
                    points.push(point);
                }

                polyline = new L.Polyline(points, {
                    weight: 8,
                    opacity: 0.4,
                    color: '#2F9F00'
                });
                this_.pathLayer.addLayer(polyline);
                // END CUSTOM
                
                //var start_and_end_stations = this_.getStations(polyline.getLatLngs()[0], polyline.getLatLngs()[polyline.getLatLngs().length - 1]);
                //this_.bikestationsWidget.setContentAndShow(start_and_end_stations['start'], start_and_end_stations['end']);

                this_.webapp.setBounds(new L.LatLngBounds([this_.startLatLng, this_.endLatLng]));


            }
        });
        
        //console.log("rw "+this.resultsWidget);
    },
    
    savePlan : function(data){
        
        var data_ = {data: data, startLat: this.startLatLng.lat, startLon: this.startLatLng.lng, endLat: this.endLatLng.lat, endLon: this.endLatLng.lng, parrent : this.webapp.currentHash };
        otp.util.DataStorage.store(data_, this.webapp );
    },
    
    restorePlan : function(data){
        
        this.startLatLng = new L.LatLng(data.startLat, data.startLon);
        this.setStartPoint(this.startLatLng, false);
        
        this.endLatLng = new L.LatLng(data.endLat, data.endLon);
        this.setEndPoint(this.endLatLng, false);
        
        this.webapp.setBounds(new L.LatLngBounds([this.startLatLng, this.endLatLng]));
        
        this.planTrip(data.data, true);
    },
        
    getModeColor : function(mode) {
        if(mode === "WALK") return '#444';
        if(mode === "BICYCLE") return '#0073e5';
        return '#aaa';
    },
    
    getStations : function(start, end) {
        //console.log('stations '+start+' '+end);
        var tol = .0001, distTol = .01;
        var start_and_end_stations = [];
        
        for(var i=0; i<this.stations.length; i++) {
            var station = this.stations[i].BikeRentalStation;
            if(Math.abs(station.x - start.lat) < tol && Math.abs(station.y - start.lng) < tol) {
                // start station
                this.stationsLayer.removeLayer(station.marker);                        
                var marker = new L.Marker(station.marker.getLatLng(), {icon: this.icons.startBike});
                marker.bindPopup(this.constructStationInfo(locale.stationInfo.pickUpBike, station));
                this.stationsLayer.addLayer(marker);
                station.marker = marker;
                start_and_end_stations['start'] = station;
            }
            //else if(this.distance(station.x, station.y, this.startLatLng.lat, this.startLatLng.lng) < distTol && 
            //        parseInt(station.bikesAvailable) > 0) {
            //    // start-adjacent station
            //    this.stationsLayer.removeLayer(station.marker);
                              
            //    var icon = this.distance(station.x, station.y, this.startLatLng.lat, this.startLatLng.lng) < distTol/2 ?  this.icons.getLarge(station) : this.icons.getMedium(station);
            //    var marker = new L.Marker(station.marker.getLatLng(), { icon: icon }); 
            //    marker.bindPopup(this.constructStationInfo(locale.stationInfo.alternatePickUp, station));
            //    this.stationsLayer.addLayer(marker);                        
            //    station.marker = marker;
            //}
            else if(Math.abs(station.x - end.lat) < tol && Math.abs(station.y - end.lng) < tol) {
                // end station
                this.stationsLayer.removeLayer(station.marker);                        
                var marker = new L.Marker(station.marker.getLatLng(), {icon: this.icons.endBike});
                marker.bindPopup(this.constructStationInfo(locale.stationInfo.dropOffBike, station));
                this.stationsLayer.addLayer(marker);
                station.marker = marker;
                start_and_end_stations['end'] = station;
            }
            //else if(this.distance(station.x, station.y, this.endLatLng.lat, this.endLatLng.lng) < distTol && 
            //        parseInt(station.bikesAvailable) > 0) {
            //    // end-adjacent station
            //    this.stationsLayer.removeLayer(station.marker);                        

            //    var icon = this.distance(station.x, station.y, this.endLatLng.lat, this.endLatLng.lng) < distTol/2 ?  this.icons.getLarge(station) : this.icons.getMedium(station);
            //    var marker = new L.Marker(station.marker.getLatLng(), {icon: icon}); 
            //    marker.bindPopup(this.constructStationInfo(locale.stationInfo.alternateDropOff, station));
            //    this.stationsLayer.addLayer(marker);                        
            //    station.marker = marker;
            //}
            else {
                this.stationsLayer.removeLayer(station.marker);                        
                var marker = new L.Marker(station.marker.getLatLng(), {
                    icon: this.icons.getSmall(station)
                }); 
                marker.bindPopup(this.constructStationInfo(locale.stationInfo.bikeStation, station));
                this.stationsLayer.addLayer(marker);
                station.marker = marker;
            }
        }
        
        return start_and_end_stations;
    },
    
    
    initStations : function() {
        //console.log('init stations');
        var this_ = this;
        this.downloadStationData(function(stations) {
            this_.stations = stations;
            for(var i=0; i<this_.stations.length; i++) {
                var station = this_.stations[i].BikeRentalStation;
                var marker = new L.Marker(new L.LatLng(station.x, station.y), {icon: this_.icons.getSmall(station)}); 
                marker.bindPopup(this_.constructStationInfo(locale.stationInfo.bikeStation, station));
                this_.stationsLayer.addLayer(marker)
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
                var newStation = newStations[i].BikeRentalStation;
                var station = this_.stationLookup[newStation.id];
                station.bikesAvailable = newStation.bikesAvailable;               
                station.spacesAvailable = newStation.spacesAvailable;               
                station.marker.bindPopup(this_.constructStationInfo(null, station)); 
            }    
        });
    },
    
    downloadStationData : function(callback) {
        var url = otp.config.hostname + 'Data/BikeStations';
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
                callback(data.stations);
            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log(textStatus, errorThrown);
            }
        });
    },
        
            
    constructStationInfo : function(title, station) {
        if(title == null) {
            title = (station.markerTitle !== undefined) ? station.markerTitle : locale.stationInfo.bikeStation;
        }
        var info = "<strong>"+title+"</strong><br/>";
        station.markerTitle = title;
        info += '<strong>'+ locale.stationInfo.station +'</strong> '+station.name+'<br/>';
        info += '<strong>'+ locale.stationInfo.bikesAvail +'</strong> '+station.bikesAvailable+'<br/>';
        info += '<strong>'+ locale.stationInfo.docksAvail +'</strong> '+station.spacesAvailable+'<br/>';
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
    
    CLASS_NAME : "otp.modules.bikeshare.BikeShareModule"
});


//otp.modules.bikeshare.BikeShareModule = new otp.Class(otp.modules.bikeshare.BikeShareModule);
