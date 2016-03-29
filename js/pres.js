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
            map = L.map('standard-map').setView([40.420537,-3.7066242], 18);
            L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=' + token, {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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