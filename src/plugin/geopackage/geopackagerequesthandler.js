goog.provide('plugin.geopackage.RequestHandler');

goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.net.IRequestHandler');


/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {os.net.IRequestHandler}
 */
plugin.geopackage.RequestHandler = function() {
  plugin.geopackage.RequestHandler.base(this, 'constructor');

  this.log = plugin.geopackage.RequestHandler.LOGGER_;

  /**
   * @type {number}
   * @protected
   */
  this.statusCode = -1;

  /**
   * @type {Array<string>}
   * @protected
   */
  this.errors = [];

  /**
   * @type {Array<Object>}
   * @protected
   */
  this.features = null;

  /**
   * @private
   */
  this.workerHandler_ = this.onMessage.bind(this);

  /**
   * @type {string}
   * @protected
   */
  this.lastId = '';

  /**
   * @type {string}
   * @protected
   */
  this.lastTableName = '';
};
goog.inherits(plugin.geopackage.RequestHandler, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
plugin.geopackage.RequestHandler.LOGGER_ = goog.log.getLogger('plugin.geopackage.RequestHandler');


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.disposeInternal = function() {
  var worker = plugin.geopackage.getWorker();
  worker.removeEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);
  plugin.geopackage.RequestHandler.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getScore = function() {
  return 100;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.handles = function(method, uri) {
  return uri.getScheme() === 'gpkg';
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getResponse = function() {
  return this.features;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getResponseHeaders = function() {
  return null;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getErrors = function() {
  return this.errors.length ? this.errors : null;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getStatusCode = function() {
  return this.statusCode;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.getHandlerType = function() {
  return plugin.geopackage.ID;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.isHandled = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.buildRequest = goog.nullFunction;


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.abort = goog.nullFunction;


/**
 * @inheritDoc
 */
plugin.geopackage.RequestHandler.prototype.execute = function(method, uri, opt_headers, opt_formatter,
    opt_nocache, opt_responseType) {
  var worker = plugin.geopackage.getWorker();
  worker.addEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);

  this.lastId = uri.getDomain();
  this.lastTableName = uri.getPath().substring(1);

  worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
    id: this.lastId,
    type: plugin.geopackage.MsgType.GET_FEATURES,
    tableName: this.lastTableName
  }));
};


/**
 * @param {Event|GeoPackageWorkerResponse} e
 * @protected
 */
plugin.geopackage.RequestHandler.prototype.onMessage = function(e) {
  var msg = /** @type {GeoPackageWorkerResponse} */ (e instanceof window.Event ? e.data : e);

  if (msg.message.id === this.lastId && msg.message.tableName === this.lastTableName) {
    var worker = plugin.geopackage.getWorker();

    if (msg.type === plugin.geopackage.MsgType.SUCCESS) {
      if (msg.data === 0) {
        // finished
        worker.removeEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);
        this.dispatchEvent(goog.net.EventType.SUCCESS);
      } else if (msg.data) {
        if ('geometry' in msg.data['properties']) {
          // this will really screw up the resulting feature
          delete msg.data['properties']['geometry'];
        }

        if (!this.features) {
          this.features = [];
        }

        this.features.push(msg.data);
      }
    } else {
      worker.removeEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);
      this.errors.push(String(msg.reason));
      this.statusCode = 500;
      this.dispatchEvent(goog.net.EventType.ERROR);
    }
  }
};
