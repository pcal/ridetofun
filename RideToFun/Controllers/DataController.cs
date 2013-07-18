using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Mvc;
using Mvc.Jsonp;
using Newtonsoft.Json;
using RideToFun.Formatters;
using RideToFun.Models;

namespace RideToFun.Controllers
{
    public class DataController : JsonpControllerBase
    {
        //private RideToFunContext db = new RideToFunContext();

        private static string _connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;

        [OutputCache(Duration = 3600, VaryByParam = "callback")]
        public JsonpResult BikeStations(string callback = "dummy")
        {
            //var stations = new List<Station>();

            WebRequest request = WebRequest.Create("http://divvybikes.com/stations/json");

            using (WebResponse response = request.GetResponse())
            {
                Console.WriteLine(((HttpWebResponse)response).StatusDescription);
                // Get the stream containing content returned by the server.
                Stream dataStream = response.GetResponseStream();
                // Open the stream using a StreamReader for easy access.
                using (StreamReader reader = new StreamReader(dataStream))
                {
                    // Read the content.
                    string json = reader.ReadToEnd();

                    DivvyResponse divvyResponse = JsonConvert.DeserializeObject<DivvyResponse>(json);
                    // Display the content.
                    Console.WriteLine(json);
                    // Clean up the streams and the response.

                    var result = new
                    {
                        stations = divvyResponse.stationBeanList.Select(s =>
                            new
                            {
                                BikeRentalStation = new
                                {
                                    id = s.id,
                                    name = s.stationName,
                                    x = s.latitude,
                                    y = s.longitude,
                                    bikesAvailable = s.availableBikes,
                                    spacesAvailable = s.availableDocks
                                }
                            })
                    };

                    return Jsonp(result, callback, JsonRequestBehavior.AllowGet);
                }
            }

            //<BikeRentalStationList>
            //<station id="339" name="Lajeunesse / Jarry" x="-73.6284" y="45.543583" bikesAvailable="12" spacesAvailable="3"/>

        }

        //[OutputCache(Duration = 3600, VaryByParam = "none")]
        public JsonpResult ClosestStation(string lat, string lng, string callback = "dummy")
        {
            var station = GetClosestStation(lat, lng);

            return Jsonp(station, callback, JsonRequestBehavior.AllowGet);
        }

        //[OutputCache(Duration = 3600, VaryByParam = "none")]
        public JsonpResult Parks(string features, string callback = "dummy")
        {
            var parks = new List<Park>();

            string queryString;
            if (String.IsNullOrEmpty(features))
            {
                queryString = @"SELECT DISTINCT Id, Name, Location.Lat AS Lat, Location.Long as Lng FROM Parks
JOIN ParkFeatures ON ParkId = Id";
            }
            else
            {
                queryString = @"SELECT DISTINCT Id, Name, Location.Lat AS Lat, Location.Long as Lng FROM Parks
JOIN ParkFeatures ON ParkId = Id
WHERE FeatureName In (@features)";
            }
            

            var park = new Park();

            using (SqlConnection connection =
                new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                if (!String.IsNullOrEmpty(features))
                {
                    command.Parameters.AddWithValue("@features", features.ToUpper());
                }

                try
                {
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        //Console.WriteLine("\t{0}\t{1}\t{2}",
                        //reader[0], reader[1], reader[2]);
                        parks.Add( new Park
                                   {
                                       id = reader["Id"].ToString(),
                                       name = reader["Name"].ToString(),
                                       x = reader["Lat"].ToString(),
                                       y = reader["Lng"].ToString()
                                   });

                    }
                    reader.Close();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }

            }

            return Jsonp(parks, callback, JsonRequestBehavior.AllowGet);

        }

        //[OutputCache(Duration = 3600, VaryByParam = "none")]
        public JsonpResult ClosestPark(string lat, string lng, string callback = "dummy")
        {
            var park = GetClosestPark(lat, lng);

            return Jsonp(park, callback, JsonRequestBehavior.AllowGet);
        }

        public JsonpResult Directions(string originLat, string originLong, string destLat, string destLong, string callback = "dummy")
        {
            var originStation = GetClosestStation(originLat, originLong);

            var destStation = GetClosestStation(destLat, destLong);

            var walkOriginSegment = GetRoute("WALK", originLat, originLong, originStation.latitude.ToString(), originStation.longitude.ToString());
            var bikeSegment = GetRoute("BICYCLE", originStation.latitude.ToString(), originStation.longitude.ToString(), destStation.latitude.ToString(), destStation.longitude.ToString());
            var walkDestSegment = GetRoute("WALK", destStation.latitude.ToString(), destStation.longitude.ToString(), destLat, destLong);

            var routes = new
                {
                    originwalk = walkOriginSegment,
                    bike = bikeSegment,
                    destwalk = walkDestSegment,
                    originstation = originStation,
                    deststation = destStation
                };

            return Jsonp(routes, callback, JsonRequestBehavior.AllowGet);

        }

        private Station GetClosestStation(string lat, string lng)
        {
            string queryString =
                String.Format(@"SELECT TOP(1) Location.ToString(), Id, StationName, latitude, longitude FROM DivvyStations
                WHERE Location.STDistance(geography::Point(@lat, @lng, 4326)) IS NOT NULL
                ORDER BY Location.STDistance(geography::Point(@lat, @lng, 4326))");

            var station = new Station();

            using (SqlConnection connection =
            new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@lat", lat);
                command.Parameters.AddWithValue("@lng", lng);

                try
                {
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        //Console.WriteLine("\t{0}\t{1}\t{2}",
                        //reader[0], reader[1], reader[2]);
                        station = new Station
                        {
                            id = (int)reader["Id"],
                            stationName = reader["StationName"].ToString(),
                            latitude = (double)reader["latitude"],
                            longitude = (double)reader["longitude"]
                        };

                    }
                    reader.Close();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }

            return station;
        }

        private Park GetClosestPark(string lat, string lng)
        {
            string queryString =
    String.Format(@"SELECT TOP(1) Location.ToString(), Id, Name, Location.Lat AS Lat, Location.Long as Lng FROM Parks
                WHERE Location.STDistance('POINT(' + @lat + ' ' + @lng + ')') IS NOT NULL
                ORDER BY Location.STDistance('POINT(' + @lat + ' ' + @lng + ')')");

            var park = new Park();

            using (SqlConnection connection =
            new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@lat", lat);
                command.Parameters.AddWithValue("@lng", lng);

                try
                {
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        //Console.WriteLine("\t{0}\t{1}\t{2}",
                        //reader[0], reader[1], reader[2]);
                        park = new Park
                        {
                            id = reader["Id"].ToString(),
                            name = reader["Name"].ToString(),
                            x = reader["Lat"].ToString(),
                            y = reader["Lng"].ToString()
                        };

                    }
                    reader.Close();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }

            return park;
        }

        private List<Segment> GetRoute(string mode, string originLat, string originLong, string destLat, string destLong)
        {
            var route = new List<Segment>();

            WebRequest request = WebRequest.Create(
                string.Format("http://routes.cloudmade.com/bcd15929b0b547619417904ec26da9ba/api/0.3/{0},{1},{2},{3}/{4}.js", 
                    originLat, 
                    originLong, 
                    destLat, 
                    destLong,
                    mode == "WALK" ? "foot" : "bicycle")
                );

            using (WebResponse response = request.GetResponse())
            {
                Console.WriteLine(((HttpWebResponse)response).StatusDescription);
                // Get the stream containing content returned by the server.
                Stream dataStream = response.GetResponseStream();
                // Open the stream using a StreamReader for easy access.
                using (StreamReader reader = new StreamReader(dataStream))
                {
                    // Read the content.
                    string json = reader.ReadToEnd();

                    RouteResponse routeResponse = JsonConvert.DeserializeObject<RouteResponse>(json);
                    // Display the content.
                    Console.WriteLine(json);
                    // Clean up the streams and the response.

                    route.AddRange(routeResponse.route_geometry.Select(segment => new Segment
                                                                                      {
                                                                                          Latitude = segment[0], 
                                                                                          Longitude = segment[1], 
                                                                                          Mode = mode
                                                                                      }));
                }
            }

            return route;
        }
    }

    public class Segment
    {
        public string Mode { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
    }

    public class Park
    {
        public string id { get; set; }
        public string name { get; set; }
        public string x { get; set; }
        public string y { get; set; }
    }

    public class DivvyResponse
    {
        public string executionTime { get; set; }
        public List<Station> stationBeanList { get; set; }
    }

    public class Location
    {
        public bool needs_recoding { get; set; }
        public string longitude { get; set; }
        public string latitude { get; set; }
    }

    public class ParkResponse
    {
        public string facility_name { get; set; }
        public string park { get; set; }
        public Location location { get; set; }
        public string y_coordinate { get; set; }
        public string park_number { get; set; }
        public string x_coordinate { get; set; }
        public string facility_type { get; set; }
    }

    public class RouteResponse
    {
        public double version { get; set; }
        public int status { get; set; }
        public RouteSummary route_summary { get; set; }
        public List<List<string>> route_geometry { get; set; }
        public List<List<string>> route_instructions { get; set; }
    }

    public class RouteSummary
    {
        public int total_distance { get; set; }
        public int total_time { get; set; }
        public string start_point { get; set; }
        public string end_point { get; set; }
        public List<List<string>> transit_points { get; set; }
    }
}
