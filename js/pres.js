var token = 'pk.eyJ1IjoibGllZG1hbiIsImEiOiJjaW1kZmh3dXEwMDFldnpra2l2YnM5YjlhIn0.W2R1bDV_tEbuy2iNVIvyvw';

L.Map.addInitHook(function() {
    var slides = document.querySelector('.slides'),
        zoom = Number(slides.style.zoom);

    if (zoom) {
        this._container.style.zoom = 1/zoom;
    } else {
        zoom = Number(slides.style.transform.replace(/.*scale\(([0-9\.]+)\).*/, '$1'));
        this._container.style.transform = 'scale(' + (1 / zoom) + ')';
    }

    this.invalidateSize();
});

window.standardMap = (function() {
    var map;

    return {
        start: function() {
            map = L.map('standard-map').setView([40.420537,-3.7066242], 19);
            L.tileLayer('https://api.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=' + token, {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 20
            }).addTo(map);
        },
        stop: function() {
            map.remove();
        }
    };
})();

window.zoomImg = (function() {
    var zoom = function() {
            if (running) {
                L.Util.requestAnimFrame(zoom);
            }
            var img = L.DomUtil.get('zoom-img');
            img.style.top = (384 - f / 2) + 'px';
            img.style.left = (384 - f / 2) + 'px';
            img.style.width = f + 'px';
            img.style.height = f + 'px';
            f += Math.sin(x)*100;
            x += 1/180*Math.PI;
        },
        x = 0,
        f = 256,
        running;

    return {
        start: function() {
            running = true;
            f = 256;
            x = 0;
            L.Util.requestAnimFrame(zoom);
        },
        stop: function() {
            running = false;
        }
    };
})();

window.utfGrid = (function() {
    var map;

    return {
        start: function() {
            var tiles = L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + token, {
                maxZoom: 18,
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            });
            var utfGrid = new L.UtfGrid('http://{s}.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.grid.json?callback={cb}');
            utfGrid.on('mouseover', function (e) {
                if (e.data) {
                    document.getElementById('utfgrid-text').innerHTML = e.data.admin;
                } else {
                    document.getElementById('utfgrid-text').innerHTML = '';
                }
                //console.log('mouseover: ' + e.data);
            });
            map = L.map('utfgrid-map')
                    .setView([0, 0], 1)
                    .addLayer(tiles)
                    .addLayer(utfGrid);
        },
        stop: function() {
            map.remove();
        }
    };
})();

window.simpleUnderneath = (function() {
    var map;

    return {
        start: function() {
            map = L.map('simple-underneath').setView([40.420537,-3.7066242], 18);
            var featureLayer = L.geoJson(undefined, {
                    pointToLayer: function(f, latLng) {
                        return L.circleMarker(latLng, {
                                radius: 4,
                                opacity: 1,
                                fillOpacity: 0.5
                            })
                            .bindPopup('<li><span class="maki-icon ' + f.properties.maki + '"></span>' + f.properties.name + '</li>');
                    }
                }).addTo(map);

            L.tileLayer('https://api.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=' + token, {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            var pois = L.tileLayer.underneath('http://{s}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
                        '{z}/{x}/{y}.vector.pbf?access_token=' + token, {
                    layers: ['poi_label'],
                    lazy: true,
                    zoomIn: 0
                })
                .addTo(map);

            map.on('click', function(e) {
                var content = '<h2>Nearby</h2> <ul>',
                    showResults = function(results) {
                        featureLayer.addData(results);
                        for (var i = 0; i < results.length; i++) {
                            var f = results[i];
                            content += '<li><span class="maki-icon ' +
                                f.properties.maki + '"></span>' +
                                f.properties.name +
                                '</li>';
                        }

                        content += '</ul>';

                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent(content)
                            .openOn(map);
                    };

                featureLayer.clearLayers();
                pois.query(e.latlng, function(err, results) {
                    if (results.length > 0) {
                        results = results.splice(0, 5);
                        showResults(results);
                    }
                }, null, 50);
            });
        },
        stop: function() {
            map.remove();
        }
    };
})();

window.advancedUnderneath = (function() {
    var map;

    var getOsmObject = function(type, osmId, cb) {
        fetch('http://www.openstreetmap.org/api/0.6/' + type + '/' + osmId, {
            mode: 'cors'
        }).then(function(response) {
            response.text().then(function(text) {
                var data = new window.DOMParser().parseFromString(text, 'text/xml'),
                    tagTags = data.getElementsByTagName('tag'),
                    tags = {},
                    i,
                    t;

                for (i = 0; i < tagTags.length; i++) {
                    t = tagTags[i];
                    tags[t.getAttribute('k')] = t.getAttribute('v');
                }

                cb(null, tags);
            });
        }, function(err) {
            cb(err);
        });
    };


    return {
        start: function() {
            map = L.map('advanced-underneath').setView([40.420537,-3.7066242], 18);
            var featureLayer = L.geoJson(undefined, {
                    pointToLayer: function(f, latLng) {
                        return L.circleMarker(latLng, {
                                radius: 4,
                                opacity: 1,
                                fillOpacity: 0.5
                            })
                            .bindPopup('<li><span class="maki-icon ' + f.properties.maki + '"></span>' + f.properties.name + '</li>');
                    }
                }).addTo(map);

            L.tileLayer('https://api.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=' + token, {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            var pois = L.tileLayer.underneath('http://{s}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
                        '{z}/{x}/{y}.vector.pbf?access_token=' + token, {
                    layers: ['poi_label'],
                    lazy: true,
                    zoomIn: 0
                })
                .addTo(map);

            map.on('click', function(e) {
                featureLayer.clearLayers();
                pois.query(e.latlng, function(err, results) {
                    if (results.length > 0) {
                        results = results.splice(0, 5);

                        featureLayer.addData(results);
                        var content = L.DomUtil.create('div', ''),
                            header = L.DomUtil.create('h2', '', content),
                            list = L.DomUtil.create('ul', '', content);

                        header.innerText = 'Nearby';

                        results.forEach(function(f) {
                            var item = L.DomUtil.create('li', '', list),
                                icon = L.DomUtil.create('span', 'maki-icon ' + f.properties.maki, item),
                                a = L.DomUtil.create('a', '', item);

                            a.innerText = f.properties.name;

                            L.DomEvent.on(a, 'click', function(e) {
                                getOsmObject('node', f.id - 1000000000000000, function(err, osmFeature) {
                                    if (err) {
                                        return console.warn(err);
                                    }

                                    var c = f.geometry.coordinates;

                                    L.popup()
                                        .setLatLng([c[1], c[0]])
                                        .setContent('<pre>' + JSON.stringify(osmFeature, null, 2) + '</pre>')
                                        .openOn(map);
                                });

                                L.DomEvent.preventDefault(e);
                            });
                        });

                        L.popup()
                            .setLatLng(e.latlng)
                            .setContent(content)
                            .openOn(map);
                    }
                }, null, 50);
            });
        },
        stop: function() {
            map.remove();
        }
    };
})();
