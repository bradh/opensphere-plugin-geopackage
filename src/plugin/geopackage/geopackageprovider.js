goog.provide('plugin.geopackage.GeoPackageProvider');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string');
goog.require('os.data.ConfigDescriptor');
goog.require('os.net.Request');
goog.require('os.ui.Icons');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.server.AbstractLoadingServer');
goog.require('plugin.geopackage');


/**
 * GeoPackage provider
 * @extends {os.ui.server.AbstractLoadingServer}
 * @constructor
 */
plugin.geopackage.GeoPackageProvider = function() {
  plugin.geopackage.GeoPackageProvider.base(this, 'constructor');
  this.log = plugin.geopackage.GeoPackageProvider.LOGGER_;

  /**
   * @private
   */
  this.workerHandler_ = this.onWorkerMessage_.bind(this);

  var w = plugin.geopackage.getWorker();
  w.addEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);
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
plugin.geopackage.GeoPackageProvider.prototype.disposeInternal = function() {
  // close any previously-opened versions
  var worker = plugin.geopackage.getWorker();
  worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
    id: this.getId(),
    type: plugin.geopackage.MsgType.CLOSE
  }));

  worker.removeEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);
  plugin.geopackage.GeoPackageProvider.base(this, 'disposeInternal');
};


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
  this.setLoading(true);

  var isNode = navigator.userAgent.toLowerCase().indexOf(' electron') > -1;
  var url = this.getUrl();

  if (isNode && os.file.isFileSystem(url)) {
    var worker = plugin.geopackage.getWorker();

    // close any previously-opened versions
    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.getId(),
      type: plugin.geopackage.MsgType.CLOSE
    }));

    // open the DB
    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.getId(),
      type: plugin.geopackage.MsgType.OPEN,
      url: url
    }));
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
 * @param {Event|GeoPackageWorkerMessage} e
 */
plugin.geopackage.GeoPackageProvider.prototype.onWorkerMessage_ = function(e) {
  var msg = /** @type {GeoPackageWorkerResponse} */ (e instanceof Event ? e.data : e);
  var worker = plugin.geopackage.getWorker();

  if (msg.message.id === this.getId()) {
    if (msg.type === plugin.geopackage.MsgType.SUCCESS) {
      if (msg.message.type === plugin.geopackage.MsgType.OPEN) {
        worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
          id: this.getId(),
          type: plugin.geopackage.MsgType.LIST_DESCRIPTORS
        }));
      } else if (msg.message.type === plugin.geopackage.MsgType.LIST_DESCRIPTORS) {
        var configs = /** @type {Array<Object<string, *>>} */ (msg.data);
        configs.forEach(this.addDescriptor_, this);
        this.finish();
      }
    } else {
      this.logError(msg.message.id + ' ' + msg.message.type + ' failed! ' + msg.reason);
    }
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
  return goog.string.intAwareCompare(a.getLabel() || '', b.getLabel() || '');
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
    var worker = plugin.geopackage.getWorker();

    // close any previously-opened versions
    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.getId(),
      type: plugin.geopackage.MsgType.CLOSE
    }));

    // open the DB
    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.getId(),
      type: plugin.geopackage.MsgType.OPEN,
      data: response
    }), [response]);
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
 * @param {Object<string, *>} config The layer config
 * @private
 */
plugin.geopackage.GeoPackageProvider.prototype.addDescriptor_ = function(config) {
  var id = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + config['title'];
  config['id'] = id;
  config['delayUpdateActive'] = true;
  config['provider'] = this.getLabel();

  if (config['type'] === plugin.geopackage.ID + '-tile') {
    config['layerType'] = os.layer.LayerType.TILES;
    config['icons'] = os.ui.Icons.TILES;
    config['minZoom'] = Math.max(config['minZoom'], 0);
    config['maxZoom'] = Math.min(config['maxZoom'], 42);
  } else if (config['type'] === plugin.geopackage.ID + '-vector') {
    var animate = config['dbColumns'].some(function(col) {
      return col['type'] === 'datetime';
    });

    config['layerType'] = os.layer.LayerType.FEATURES;
    config['icons'] = os.ui.Icons.FEATURES + (animate ? os.ui.Icons.TIME : '');
    config['url'] = 'gpkg://' + this.getId() + '/' + config['title'];
    config['animate'] = animate;
  }

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
  }
};
