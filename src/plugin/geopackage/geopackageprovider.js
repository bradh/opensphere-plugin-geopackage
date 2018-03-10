goog.provide('plugin.geopackage.GeoPackageProvider');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string');
goog.require('os.data.ConfigDescriptor');
goog.require('os.net.Request');
goog.require('os.ui.Icons');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.server.AbstractLoadingServer');


/**
 * GeoPackage provider
 * @extends {os.ui.server.AbstractLoadingServer}
 * @constructor
 */
plugin.geopackage.GeoPackageProvider = function() {
  plugin.geopackage.GeoPackageProvider.base(this, 'constructor');
  this.log = plugin.geopackage.GeoPackageProvider.LOGGER_;

  /**
   * @type {GeoPackage}
   * @private
   */
  this.geopkg_ = null;

  /**
   * @type {number}
   * @private
   */
  this.itemsRemaining_ = 0;
};
goog.inherits(plugin.geopackage.GeoPackageProvider, os.ui.server.AbstractLoadingServer);
goog.addSingletonGetter(plugin.geopackage.GeoPackageProvider);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.geopackage.GeoPackageProvider.LOGGER_ = goog.log.getLogger('plugin.geopackage.GeoPackageProvider');


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageProvider.prototype.configure = function(config) {
  plugin.geopackage.GeoPackageProvider.base(this, 'configure', config);
  this.setUrl(/** @type{string} */ (config['url']));
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageProvider.prototype.load = function(opt_ping) {
  plugin.geopackage.GeoPackageProvider.base(this, 'load', opt_ping);
  this.itemsRemaining_ = 0;
  this.setLoading(true);

  var isNode = false;
  // try {
  //   isNode = Object.prototype.toString.call(global.process) === '[object process]';
  // } catch (e) {
  // }

  if (isNode) {
    // var geopackage = require('@ngageoint/geopackage');
    // geopackage.openGeoPackage(this.url, this.onLoad_.bind(this));
  } else {
    var request = new os.net.Request(this.getUrl());
    request.setHeader('Accept', '*/*');
    request.listen(goog.net.EventType.SUCCESS, this.onUrl_, false, this);
    request.listen(goog.net.EventType.ERROR, this.onUrlError_, false, this);
    request.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
    request.load();
  }
};


/**
 * @inheritDoc
 */
plugin.geopackage.GeoPackageProvider.prototype.finish = function() {
  var children = this.getChildren();
  if (children) {
    children.sort(plugin.geopackage.GeoPackageProvider.sort_);
  }

  plugin.geopackage.GeoPackageProvider.base(this, 'finish');
};


/**
 * @param {os.structs.ITreeNode} a The first node
 * @param {os.structs.ITreeNode} b The second node
 * @return {number} per typical compare functions
 */
plugin.geopackage.GeoPackageProvider.sort_ = function(a, b) {
  if ((!a.getLabel()) || (!b.getLabel())) {
    return 0;
  }
  return goog.string.intAwareCompare(/** @type{string} */ (a.getLabel()), /** @type{string} */ (b.getLabel()));
};


/**
 * @param {goog.events.Event} event The event
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onUrl_ = function(event) {
  var req = /** @type {os.net.Request} */ (event.target);
  var response = req.getResponse();
  goog.dispose(req);

  if (response instanceof ArrayBuffer) {
    geopackage.openGeoPackageByteArray(new Uint8Array(response), this.onLoad_.bind(this));
  }
};


/**
 * @param {goog.events.Event} event The event
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onUrlError_ = function(event) {
  var req = /** @type {os.net.Request} */ (event.target);
  var errors = req.getErrors();
  var uri = req.getUri();
  goog.dispose(req);

  var href = uri.toString();
  var msg = 'Request failed for <a target="_blank" href="' + href + '">GeoPackage</a> ';

  if (errors) {
    msg += errors.join(' ');
  }

  this.logError(msg);
};


/**
 * @param {*} msg The error message.
 * @protected
 */
plugin.geopackage.GeoPackageProvider.prototype.logError = function(msg) {
  msg = goog.string.makeSafe(msg);

  if (!this.getError()) {
    var errorMsg = 'Server [' + this.getLabel() + ']: ' + msg;

    if (!this.getPing()) {
      os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
    }

    goog.log.error(this.log, errorMsg);

    this.setErrorMessage(errorMsg);
    this.setLoading(false);
  }
};


/**
 * @param {*} err The error message, if any
 * @param {GeoPackage} gpkg The GeoPackage
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onLoad_ = function(err, gpkg) {
  if (err) {
    this.logError(err);
    return;
  }

  this.geopkg_ = gpkg;

  this.setChildren(null);
  this.geopkg_.getTileTables(this.onTileTables_.bind(this));
  this.geopkg_.getFeatureTables(this.onFeatureTables_.bind(this));
};


/**
 * @param {*} err The error message, if any
 * @param {Array<!string>} tileTables The list of tile tables
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onTileTables_ = function(err, tileTables) {
  if (err) {
    this.logError(err);
    return;
  }

  if (tileTables) {
    var handler = this.onTileDao_.bind(this);
    var gpkg = this.geopkg_;

    this.itemsRemaining_ += tileTables.length;

    tileTables.forEach(function(tileTable) {
      gpkg.getTileDaoWithTableName(tileTable, handler);
    });
  }
};


/**
 * @param {*} err Error message, if any
 * @param {GeoPackage.TileDao} tileDao The tile data access object
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onTileDao_ = function(err, tileDao) {
  if (err) {
    this.logError(err);
    return;
  }

  if (tileDao) {
    this.geopkg_.getInfoForTable(tileDao, this.onTileInfo_.bind(this));
  }
};


/**
 * @param {*} err Error message, if any
 * @param {Object<string, *>} info
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onTileInfo_ = function(err, info) {
  if (err) {
    this.logError(err);
    return;
  }

  if (info) {
    var id = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + info['tableName'];

    var config = {
      'id': id,
      'type': plugin.geopackage.ID + '-tile',
      'provider': this.getLabel(),
      'layerType': os.layer.LayerType.TILES,
      'icons': os.ui.Icons.TILES,
      'delayUpdateActive': true,
      'title': info['tableName'],
      'minZoom': info['minZoom'],
      'maxZoom': info['maxZoom']
    };

    if (info['contents']) {
      config['title'] = info['contents']['identifier'] || config['title'];
      config['description'] =  info['contents']['description'] || config['description'];
    }

    if (info['srs']) {
      config['projection'] = info['srs']['organization'].toUpperCase() + ':' +
          (info['srs']['organization_coordsys_id'] || info['srs']['id']);
    }

    if (info['tileMatrixSet']) {
      config['extent'] = [
        info['tileMatrixSet']['minX'],
        info['tileMatrixSet']['minY'],
        info['tileMatrixSet']['maxX'],
        info['tileMatrixSet']['maxY']];

      config['extentProjection'] = config['projection'] || 'EPSG:' + info['tileMatrixSet']['srsId'];
    }

    // TODO: is there a way to determine whether the layer is opaque (i.e. should be a base map)?
    this.addDescriptor_(config);
  }

  if (this.itemsRemaining_ === 0) {
    this.finish();
  }
};


/**
 * @param {*} err The error message, if any
 * @param {Array<!string>} featureTables The list of feature tables
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onFeatureTables_ = function(err, featureTables) {
  if (err) {
    this.logError(err);
    return;
  }

  if (featureTables) {
    var handler = this.onFeatureDao_.bind(this);
    var gpkg = this.geopkg_;

    this.itemsRemaining_ += featureTables.length;

    featureTables.forEach(function(featureTable) {
      gpkg.getFeatureDaoWithTableName(featureTable, handler);
    });
  }
};


/**
 * @param {*} err The error message, if any
 * @param {GeoPackage.FeatureDao} featureDao The feature data access object
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onFeatureDao_ = function(err, featureDao) {
  if (err) {
    this.logError(err);
    return;
  }

  if (featureDao) {
    this.geopkg_.getInfoForTable(featureDao, this.onFeatureInfo_.bind(this));
  }
};


/**
 * @param {*} err The error message, if any
 * @param {Object<string, *>} info
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.onFeatureInfo_ = function(err, info) {
  if (err) {
    this.logError(err);
    return;
  }

  if (info) {
    var id = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + info['tableName'];

    var config = {
      'id': id,
      'type': plugin.geopackage.ID + '-feature',
      'provider': this.getLabel(),
      'layerType': os.layer.LayerType.FEATURES,
      'icons': os.ui.Icons.FEATURES,
      'delayUpdateActive': true,
      'title': info['tableName']
    };

    if (info['contents']) {
      config['title'] = info['contents']['identifier'] || config['title'];
      config['description'] =  info['contents']['description'] || config['description'];
    }

    this.addDescriptor_(config);
  }

  if (this.itemsRemaining_ === 0) {
    this.finish();
  }
};


/**
 * @param {Object<string, *>} config The layer config
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.addDescriptor_ = function(config) {
  var id = /** @type {string} */ (config['id']);

  if (id) {
    var descriptor = /** @type {os.data.ConfigDescriptor} */ (os.dataManager.getDescriptor(id));
    if (!descriptor) {
      descriptor = new os.data.ConfigDescriptor();
    }

    descriptor.setBaseConfig(config);
    os.dataManager.addDescriptor(descriptor);
    descriptor.updateActiveFromTemp();

    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(descriptor);

    this.addChild(node);
    this.itemsRemaining_--;
  }
};
