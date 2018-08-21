goog.provide('plugin.geopackage.GeoPackagePlugin');

goog.require('os.data.DataManager');
goog.require('os.data.DataProviderEventType');
goog.require('os.data.ProviderEntry');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');
goog.require('os.ui.exportManager');
goog.require('plugin.geopackage');
goog.require('plugin.geopackage.Exporter');
goog.require('plugin.geopackage.GeoPackageImportUI');
goog.require('plugin.geopackage.GeoPackageProvider');
goog.require('plugin.geopackage.RequestHandler');
goog.require('plugin.geopackage.TileLayerConfig');
goog.require('plugin.geopackage.VectorLayerConfig');
goog.require('plugin.geopackage.mime');


/**
 * Provides support for GeoPackage vector files
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.geopackage.GeoPackagePlugin = function() {
  plugin.geopackage.GeoPackagePlugin.base(this, 'constructor');
  this.id = plugin.geopackage.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.geopackage.GeoPackagePlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackagePlugin.prototype.init = function() {
  // register geopackage provider type
  var dm = os.data.DataManager.getInstance();
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.geopackage.ID,
      plugin.geopackage.GeoPackageProvider,
      'GeoPackage File',
      'Provides raster and vector data in a single file format'));

  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.geopackage.ID + '-tile', plugin.geopackage.TileLayerConfig);
  lcm.registerLayerConfig(plugin.geopackage.ID + '-vector', plugin.geopackage.VectorLayerConfig);

  os.net.RequestHandlerFactory.addHandler(plugin.geopackage.RequestHandler);

  // register the GeoPackage exporter
  os.ui.exportManager.registerExportMethod(new plugin.geopackage.Exporter());

  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('GeoPackage', true);
  im.registerImportUI(plugin.geopackage.mime.TYPE, new plugin.geopackage.GeoPackageImportUI);

  os.dataManager.listen(os.data.DataProviderEventType.REMOVE_PROVIDER, this.onProviderRemove_, false, this);
};


/**
 * @param {os.data.DataProviderEvent} evt
 */
plugin.geopackage.GeoPackagePlugin.prototype.onProviderRemove_ = function(evt) {
  if (evt.dataProvider instanceof plugin.geopackage.GeoPackageProvider && os.file.isLocal(evt.dataProvider.getUrl())) {
    var fs = os.file.FileStorage.getInstance();
    if (fs.fileExists(evt.dataProvider.getUrl())) {
      fs.deleteFile(evt.dataProvider.getUrl());
    }
  }
};

// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.geopackage.GeoPackagePlugin());
