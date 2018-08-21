goog.require('plugin.geopackage.GeoPackageProvider');

describe('plugin.geopackage.GeoPackageProvider', function() {
  plugin.geopackage.ROOT = 'base/';
  var baseUrl = '/base/test/resources/geopackage/';

  it('should configure properly', function() {
    var p = new plugin.geopackage.GeoPackageProvider();

    var conf = {
      type: 'geopackage',
      label: 'Test Label',
      url: '/path/to/something.gpkg'
    };

    p.configure(conf);

    expect(p.getLabel()).toBe(conf.label);
    expect(p.getUrl()).toBe(conf.url);
  });

  it('should parse geopackages properly', function() {
    var p = new plugin.geopackage.GeoPackageProvider();
    p.setUrl(baseUrl + 'gdal_sample_v1.2_no_extensions.gpkg');

    var count = 0;
    var listener = function(e) {
      count++;
    };

    p.listen(os.data.DataProviderEventType.LOADED, listener);

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return count > 0;
    }, 'GeoPackage to load', 5000);

    runs(function() {
      var children = p.getChildren();
      var prefix = p.getId() + os.ui.data.BaseProvider.ID_DELIMITER;

      var expected = [{
        id: prefix + 'byte_jpeg',
        title: 'byte_jpeg',
        layerType: os.layer.LayerType.TILES,
        icons: os.ui.Icons.TILES,
        minZoom: 0,
        maxZoom: 0,
        projection: 'EPSG:26711',
        extentProjection: 'EPSG:26711',
        extent: [440720, 3735960, 456080, 3751320]
      }, {
        id: prefix + 'byte_png',
        title: 'byte_png',
        layerType: os.layer.LayerType.TILES,
        icons: os.ui.Icons.TILES,
        minZoom: 0,
        maxZoom: 0,
        projection: 'EPSG:26711',
        extentProjection: 'EPSG:26711',
        extent: [440720, 3735960, 456080, 3751320]
      }, {
        id: prefix + 'geomcollection2d',
        title: 'geomcollection2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'geomcollection3d',
        title: 'geomcollection3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'geometry2d',
        title: 'geometry2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'geometry3d',
        title: 'geometry3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'linestring2d',
        title: 'linestring2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'linestring3d',
        title: 'linestring3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'multilinestring2d',
        title: 'multilinestring2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'multilinestring3d',
        title: 'multilinestring3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'multipoint2d',
        title: 'multipoint2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'multipoint3d',
        title: 'multipoint3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'multipolygon2d',
        title: 'multipolygon2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'multipolygon3d',
        title: 'multipolygon3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'point2d',
        title: 'point2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES + os.ui.Icons.TIME
      }, {
        id: prefix + 'point3d',
        title: 'point3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'polygon2d',
        title: 'polygon2d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }, {
        id: prefix + 'polygon3d',
        title: 'polygon3d',
        layerType: os.layer.LayerType.FEATURES,
        icons: os.ui.Icons.FEATURES
      }];

      expect(children.length).toBe(expected.length);
      for (var i = 0, n = children.length; i < n; i++) {
        var config = children[i].getDescriptor().getBaseConfig();

        expect(config.provider).toBe(p.getLabel());
        expect(config.delayUpdateActive).toBe(true);

        for (var key in expected[i]) {
          expect(config[key]).toEqual(expected[i][key]);
        }
      }
    });
  });

  it('should log errors of all types', function() {
    var p = new plugin.geopackage.GeoPackageProvider();
    var fns = [
      function() {
        p.logError(undefined);
      }, function() {
        p.logError(null);
      }, function() {
        p.logError(new Error('This is only a test error'));
      }, function() {
        p.logError(1234);
      }, function() {
        p.logError('This is only a test message');
      }];

    fns.forEach(function(fn) {
      expect(fn).not.toThrow();
      expect(p.getErrorMessage()).toBeTruthy();
      expect(p.getError()).toBe(true);

      // reset for next
      p.setError(false);
    });
  });

  it('should handle request errors', function() {
    var p = new plugin.geopackage.GeoPackageProvider();
    p.setUrl(baseUrl + 'doesnotexist.gpkg');

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return !p.isLoading();
    }, 'GeoPackage to load/error', 5000);

    runs(function() {
      expect(p.getError()).toBe(true);
      expect(p.getErrorMessage()).toContain('Request failed');
    });
  });
});
