function createStubs() {

    var $ = window.top.jQuery;
    var gmapinitialized = false;
    var google = null;
    var map = null;
    var mapView = null;
    var directionsMapView = null;
    var markers = [];
    var markersId = [];
    var infoWindows = [];
    var lastBound = null;

    function initOpenMapForDirections(params) {

        $('#directions-map-canvas').remove();

        /* Creates fake 'back' button and hides the original one */
        $('#platform-events-fire-back').css("display", "none");
        $('#platform-events-fire-suspend')
                .before(
                        "<button id=\"platform-events-fire-back-map\" class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only\"><span class=\"ui-button-text\">Back</span></button>");
        $('#platform-events-fire-back-map').css("width", "90px");

        var viewMapTemplate = [
                "<section id=\"directions-map-canvas\" style=\"display:none; width:100%; height:100%; position: absolute;\">",
                "</section>" ].join("\n");

        var viewMap = $(viewMapTemplate);
        $('#overlay-views').append(viewMap);
        return viewMap;
    }

    function initMapDiv() {

        $('#map-canvas').remove();

        var viewMapTemplate = [
                "<section id=\"map-canvas\" style=\"z-index:-1;display:none; width:100%; height:100%; position: absolute;\">",
                // "<div id=\"map-canvas\" style=\"position: absolute; width: 100%; height: 100%;\">", "</div>",
                "</section>" ].join("\n");

        var viewMap = $(viewMapTemplate);
        $('#overlay-views').append(viewMap);
        $('#overlay-views').parent().css("z-index", 1);
        return viewMap;
    }

    function setDimension(dim) {
        if (dim && mapView) {
            var center = map.getCenter();
            mapView.width(dim.width).height(dim.height).css("top", dim.top).css("left", dim.left);
            google.maps.event.trigger(map, 'resize');

            setTimeout(function() {
                if (lastBound) {
                    !lastBound.equals(map.getBounds()) && map.fitBounds(lastBound);
                } else {
                    map.setCenter(center);
                }
            }, 150);
        }
    }

    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxyxxyxxxyxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
    ;

    function fitBounds(targets) {
        var bound = new google.maps.LatLngBounds();
        targets.forEach(function(pos) {
            bound.extend(new google.maps.LatLng(pos.lat, pos.lng));
        });
        lastBound = bound;
        setTimeout(function() {
            map.fitBounds(bound);
            setTimeout(function() {
                lastBound = null;
            }, 1500);
        }, 150);
    }

    function loadScript() {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' + '&callback=gmapinitialize';
        $('body').append(script);
    }

    function onMarkerEvent(eventName, id) {
        plugin.google.maps.Map._onMarkerEvent(eventName, id);
    }

    var Map = {
        "moveCamera": function(options) {
            var targets = options.target;
            map.setZoom(options.zoom);
            if (options.target && options.target.length) {
                fitBounds(options.target)
            }
        }
    };

    var Marker = {
        "createMarker": function(options) {
            var uuid = generateUUID();
            var newOptions = {
                "title": options.title,
                "position": new google.maps.LatLng(options.position.lat, options.position.lng)
            }
            var marker = new google.maps.Marker(newOptions);

            var contentString = $("<div style=\"cursor: pointer\"><strong>" + (options.title || "") + "</strong></div>");
            if (options.snippet) {
                contentString.append($("<p>" + options.snippet + "</p>)"));
            }

            var infoWindow = new google.maps.InfoWindow({
                content: contentString[0]
            });
            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.open(map, marker);
                onMarkerEvent(plugin.google.maps.event.MARKER_CLICK, uuid)
            });

            google.maps.event.addDomListener(contentString[0], "click", function(event) {
                onMarkerEvent(plugin.google.maps.event.INFO_CLICK, uuid);
                infoWindow.close();
            });

            marker.setMap(map);
            markers.push(marker);
            markersId.push(uuid);
            infoWindows.push(infoWindow);
            return {
                "id": uuid
            };
        },
        "remove": function(id) {
            var index = markersId.indexOf(id);
            if (index >= 0) {
                var marker = markers[index];
                marker.setMap(null);
                infoWindows.setMap(null);
                infoWindows.close();
                markers.splice(index, 1);
                markersId.splice(index, 1);
                infoWindows.splice(index, 1);
            }
        },
        "setTitle": function(id, title) {
            if (markersId.indexOf(id) >= 0) {
                var marker = markers[markersId.indexOf(id)];
                var infoWindow = infoWindows[markersId.indexOf(id)];
                marker.setTitle(title);
                $("strong", infoWindow.getContent()).text(title);
            }
        },
        "setSnippet": function(id, snippet) {
            if (markersId.indexOf(id) >= 0) {
                var infoWindow = infoWindows[markersId.indexOf(id)];
                if ($("p", infoWindow.getContent()).length) {
                    if (snipppet) {
                        $("p", infoWindow.getContent()).text(snippet);
                    } else {
                        $("p", infoWindow.getContent()).remove();
                    }
                } else {
                    $(infoWindow.getContent()).append($("<p>" + snippet + "</p>)"));
                }
            }
        },
        "getPosition": function(id) {
            if (markersId.indexOf(id) >= 0) {
                var marker = markers[markersId.indexOf(id)];
                return {
                    "lat": marker.position.A,
                    "lng": marker.position.F
                };
            }
        },
        "setPosition": function(id, lat, lng) {
            var index = markersId.indexOf(id);
            if (index >= 0) {
                var marker = markers[index];
                var infoWindow = infoWindows[index];
                var pos = new google.maps.LatLng(lat, lng);
                marker.setPosition(pos);
                infoWindow.setPosition(pos);
            }
        }

    }

    window.top["gmapinitialize"] = function() {
        gmapinitialized = true;
        google = window.top.google;
    };

    setTimeout(loadScript, 400);

    return {
        GoogleMaps: {
            isAvailable: function() {
                return gmapinitialized;
            },
            getMap: function(options) {

                if (!map) {
                    mapView = initMapDiv();
                    map = new google.maps.Map(mapView[0], options);
                    mapView.mouseleave(function(e) {
                        window.frameElement.style.pointerEvents = "";
                    });
                } else {
                    map.setOptions(options);
                }
            },
            setVisible: function(isVisible) {
                if (isVisible) {
                    mapView.show();
                    window.frameElement.style.background = "transparent";
                } else {
                    mapView.hide();
                    window.frameElement.style.background = "";
                    window.frameElement.style.pointerEvents = "";
                }
            },
            resizeMap: function(dim) {
                setDimension(dim);
            },
            setDiv: function(dim) {
                setDimension(dim);
                var wrMap = window.document.elementFromPoint(dim.left, dim.top);
                wrMap.addEventListener("mouseover", function(e) {
                    window.frameElement.style.pointerEvents = "none";
                });

                mapView.show();
                window.frameElement.style.background = "transparent";
            },
            remove: function() {
                mapView.hide('slide', {
                    direction: 'left',
                    duration: 250
                });
                window.frameElement.style.pointerEvents = "";
                window.frameElement.style.background = "";
                this.clear();
            },
            clear: function() {
                markers.forEach(function(marker) {
                    marker.setMap(null);
                });
                markers = [];
                markersId = [];
                infoWindows = [];
            },
            exec: function() {
                var calledMethod = arguments[0];
                if (calledMethod === "Marker.createMarker") {
                    return Marker.createMarker(arguments[1]);
                } else if (calledMethod === "Marker.getPosition") {
                    return Marker.getPosition(arguments[1]);
                } else if (calledMethod === "Marker.remove") {
                    return Marker.remove(arguments[1]);
                } else if (calledMethod === "Marker.setTitle") {
                    return Marker.setTitle(arguments[1], arguments[2]);
                } else if (calledMethod === "Marker.setSnippet") {
                    return Marker.setSnippet(arguments[1], arguments[2]);
                } else if (calledMethod === "Marker.setPosition") {
                    return Marker.setPosition(arguments[1], arguments[2], arguments[3]);
                } else if (calledMethod === "Map.moveCamera") {
                    return Map.moveCamera(arguments[1], arguments[2]);
                }
            }
        },
        External: {
            launchNavigation: function(params) {

                directionsMapView = initOpenMapForDirections();

                var directionsDisplay;
                var directionsService = new google.maps.DirectionsService();
                var directionsMap;

                directionsDisplay = new google.maps.DirectionsRenderer();

                var mapOptions = {
                    zoom: 8,
                    center: new google.maps.LatLng(-34.397, 150.644)
                };

                directionsMap = new google.maps.Map(directionsMapView[0], mapOptions);

                directionsDisplay.setMap(directionsMap);

                var request = {
                    origin: params.from,
                    destination: params.to,
                    travelMode: google.maps.TravelMode.DRIVING
                };

                directionsService.route(request, function(response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                    }
                });

                /* User clicks 'back' button */
                $('#platform-events-fire-back-map').click(function(e) {

                    /* Restores original 'back' button */
                    $('#platform-events-fire-back-map').remove();
                    $('#platform-events-fire-back').css("display", "initial");

                    directionsMapView.hide('slide', {
                        direction: 'left',
                        duration: 250
                    });
                });

                directionsMapView.show('slide', {
                    direction: 'right',
                    duration: 250
                });
            }
        },
        Geocoder: {
            geocode: function(address) {
                geocoder = new google.maps.Geocoder();

                var geocoderPromise = new Promise(function(resolve, reject) {
                    geocoder.geocode(address, function(results, status) {

                        if (status == google.maps.GeocoderStatus.OK) {
                            var position = [];
                            var location = results[0].geometry.location;

                            position.push({
                                position: {
                                    "lat": location.A,
                                    "lng": location.F
                                }
                            });
                            resolve(position);
                        } else {
                            reject('Geocode was not successful for the following reason: ' + status);
                        }
                    });
                })

                return geocoderPromise.then(function(position) {
                    return position;
                }, function(e) {
                    console.log(e);
                });
            }
        }
    };
};