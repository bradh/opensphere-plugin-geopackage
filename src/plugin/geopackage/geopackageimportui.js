goog.provide('plugin.geopackage.GeoPackageImportUI');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.file');
goog.require('os.file.FileStorage');
goog.require('os.ui.im.AbstractImportUI');
goog.require('os.ui.menu.windows');
goog.require('plugin.geopackage');
goog.require('plugin.geopackage.GeoPackageProvider');

/**
 * @constructor
 * @extends {os.ui.im.AbstractImportUI}
 */
plugin.geopackage.GeoPackageImportUI = function() {
  /**
   * @type {boolean}
   */
  this.requiresStorage = !os.file.FILE_URL_ENABLED;

  /**
   * @type {os.file.File}
   * @protected
   */
  this.file = null;
};
goog.inherits(plugin.geopackage.GeoPackageImportUI, os.ui.im.AbstractImportUI);


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageImportUI.prototype.launchUI = function(file, opt_config) {
  if (file) {
    this.file = file;
    var url = file.getUrl();

    // see if there are any other geopackage providers for the same file
    var list = os.dataManager.getProviderRoot().getChildren().filter(function(provider) {
      return provider instanceof plugin.geopackage.GeoPackageProvider && provider.getUrl() === url;
    });

    if (list.length) {
      list.forEach(function(provider) {
        provider.load();
      });

      os.alertManager.sendAlert(file.getFileName() + ' GeoPackage refreshed',
          os.alert.AlertEventSeverity.INFO);
    } else if (os.file.isLocal(file)) {
      os.file.FileStorage.getInstance().storeFile(file, true).addCallbacks(
          this.onFileReady, this.onFileError, this);
    } else {
      this.onFileReady();
    }
  }
};


/**
 * @protected
 */
plugin.geopackage.GeoPackageImportUI.prototype.onFileReady = function() {
  var file = this.file;
  var conf = {
    'type': plugin.geopackage.ID,
    'label': file.getFileName(),
    'url': file.getUrl()
  };

  var provider = new plugin.geopackage.GeoPackageProvider();
  provider.configure(conf);
  provider.setId(goog.string.getRandomString());
  provider.setEnabled(true);
  provider.setEditable(true);
  provider.load();

  os.settings.set(['userProviders', provider.getId()], conf);
  os.dataManager.addProvider(provider);

  os.alertManager.sendAlert(file.getFileName() + ' GeoPackage added!',
      os.alert.AlertEventSeverity.INFO);

  os.ui.menu.windows.openWindow('addData');
  this.file = null;
};


/**
 * @param {*=} opt_reason
 * @protected
 */
plugin.geopackage.GeoPackageImportUI.prototype.onFileError = function(opt_reason) {
  os.alertManager.sendAlert('Error adding GeoPackage. ' + opt_reason);
  this.file = null;
};
