goog.provide('plugin.geopackage.VectorLayerConfig');

goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.ogc.wfs.FeatureType');
goog.require('plugin.file.geojson.GeoJSONLayerConfig');
goog.require('plugin.ogc.wfs.WFSLayerConfig');


/**
 * @extends {plugin.file.geojson.GeoJSONLayerConfig}
 * @constructor
 */
plugin.geopackage.VectorLayerConfig = function() {
  plugin.geopackage.VectorLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.geopackage.VectorLayerConfig, plugin.file.geojson.GeoJSONLayerConfig);


/**
 * @inheritDoc
 */
plugin.geopackage.VectorLayerConfig.prototype.getLayer = function(source, options) {
  var featureType = new os.ogc.wfs.FeatureType(
      /** @type {string} */ (options['id']),
      /** @type {Array<!os.ogc.FeatureTypeColumn>} */ (options['dbColumns']));

  var layer = plugin.geopackage.VectorLayerConfig.base(this, 'getLayer', source, options);

  this.fixFeatureTypeColumns(layer, options, featureType);
  this.addMappings(layer, options, featureType);

  return layer;
};


/**
 * @param {os.layer.Vector} layer
 * @param {Object<string, *>} options
 * @param {os.ogc.IFeatureType} featureType
 */
plugin.geopackage.VectorLayerConfig.prototype.addMappings = function(layer, options, featureType) {
  var animate = goog.isDefAndNotNull(options['animate']) ? options['animate'] : false;
  var source = /** @type {os.source.Request} */ (layer.getSource());
  var importer = /** @type {os.im.Importer} */ (source.getImporter());

  var execMappings = [];
  var startField = featureType.getStartDateColumnName();
  var endField = featureType.getEndDateColumnName();

  if (animate && startField) {
    if (startField != endField) {
      // add a start/end datetime mapping
      // this mapping does not remove the original fields since it's mapping two fields to one, and the original
      // fields may be wanted when exporting data
      var mapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.START);
      mapping.field = startField;
      mapping.setFormat(os.im.mapping.TimeFormat.ISO);
      execMappings.push(mapping);

      mapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.END);
      mapping.field = endField;
      mapping.setFormat(os.im.mapping.TimeFormat.ISO);
      execMappings.push(mapping);
    } else {
      // add a datetime mapping
      // this mapping removes the original field since we're replacing the original with our own
      mapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.INSTANT);
      mapping.field = startField;
      mapping.setFormat(os.im.mapping.TimeFormat.ISO);
      execMappings.push(mapping);
    }
  }

  if (execMappings && execMappings.length > 0) {
    importer.setExecMappings(execMappings);
  }

  // tell the importer we want to run a different set of autodetection mappers
  importer.selectAutoMappings([os.im.mapping.AltMapping.ID, os.im.mapping.RadiusMapping.ID,
    os.im.mapping.SemiMajorMapping.ID, os.im.mapping.SemiMinorMapping.ID]);
};
