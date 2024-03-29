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

otp.namespace("otp.core");

otp.core.Webapp = {

    map     : null,
    
    modules : [ ],
    
    activeModule : null,
    currentHash : null,

    
    initialize : function(config) {

        otp.configure(this, config);

        this.map = new otp.core.Map();        
        
        this.addModule(new otp.modules.bikeshare.BikeShareModule(this), true);

        var __this = this;
        $("#features span").on("click", function () {
            $(this).addClass("selected");
            __this.addModule(new otp.modules.park.ParkModule(this), true);
            $(this).parent().slideUp('slow');
        });
        
        // Init AddThis
  //       addthis_config = {
        //      pubid: "ra-4fb549f217255a7d",
        //      data_track_clickback: false
        // };
        // $.getScript("http://s7.addthis.com/js/250/addthis_widget.js#pubid=ra-4fb549f217255a7d");
        
        if(window.location.hash !== "")
            otp.util.DataStorage.retreive(window.location.hash.replace("#", ""), this);
        
    },
    
    addModule : function(module, makeActive) {
        makeActive = typeof makeActive !== 'undefined' ? makeActive : false;
        this.modules.push(module);
        if(makeActive) {
            this.setActiveModule(module);
        }
        this.setLinks(module);
    },
    
    setActiveModule : function(module) {
        console.log("set active module: "+module.moduleName);
        this.map.activeModuleChanged(module);
        this.activeModule = module;
    },   
    
    restoreTrip : function(data) {
        
        this.activeModule.restorePlan(data);
   
    },
    
    setLinks : function(module) {
        var aboutLink = $("#about_link");
        var contactLink = $("#contact_link");
                
        aboutLink.click(function(e) {
            e.preventDefault("about");
            module.showAboutInfo();
        });	
        contactLink.click(function(e) {
            e.preventDefault();
            module.showContactInfo();
        });
    },
    
    setBounds : function(bounds)
    {
        this.map.lmap.fitBounds(bounds);
    },
    
    getLocation: function(callback) {
        this.map.lmap.getLocation(callback);
    },
        
    newTrip : function(hash) {
        
        this.currentHash = hash;	
        
        window.location.hash = this.currentHash;
        
        var shareRoute = $("#share-route");
        shareRoute.find(".addthis_toolbox").attr("addthis:url", "http://cibi.me/#"+this.currentHash);
        addthis.toolbox(".addthis_toolbox_route");
    },    
    
    CLASS_NAME : "otp.core.Webapp"
}


otp.core.Webapp = new otp.Class(otp.core.Webapp);
