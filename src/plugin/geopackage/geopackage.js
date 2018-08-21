goog.provide('plugin.geopackage');

goog.require('goog.log');


/**
 * @define {string}
 */
goog.define('plugin.geopackage.ROOT', '../opensphere-plugin-geopackage/');

/**
 * @define {string}
 */
goog.define('plugin.geopackage.GPKG_PATH', 'vendor/geopackage/geopackage.min.js');

/**
 * @type {string}
 * @const
 */
plugin.geopackage.ID = 'geopackage';


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.geopackage.LOGGER = goog.log.getLogger('plugin.geopackage');


/**
 * @enum {string}
 */
plugin.geopackage.MsgType = {
  OPEN_LIBRARY: 'openLibrary',
  OPEN: 'open',
  CLOSE: 'close',
  LIST_DESCRIPTORS: 'listDescriptors',
  GET_TILE: 'getTile',
  GET_FEATURES: 'getFeatures',
  EXPORT: 'export',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * @enum {string}
 */
plugin.geopackage.ExportCommands = {
  CREATE: 'create',
  CREATE_TABLE: 'createTable',
  GEOJSON: 'geojson',
  WRITE: 'write',
  GET_CHUNK: 'getChunk',
  WRITE_FINISH: 'writeFinish'
};


/**
 * @type {?Worker}
 * @private
 */
plugin.geopackage.worker_ = null;


/**
 * @return {!Worker} The GeoPackage worker
 */
plugin.geopackage.getWorker = function() {
  if (!plugin.geopackage.worker_) {
    var src = plugin.geopackage.ROOT + 'src/worker/gpkg.worker.js';

    if (window.global && window['process']) {
      // The node context (as opposed to the electron browser context), loads
      // paths relative to process.cwd(). Therefore, we need to make our source
      // path absolute.
      src = window['require']('path').join(window['__dirname'], src);

      // spawn a child process and make it look like a worker

      // bracket notation because closure + browser AND node is gonna suck
      var cp = window['require']('child_process');

      // to debug this guy:
      //  - open chrome://inspect/#devices
      //  - change the next two lines here to the debug version
      //  - open/start the application
      //  - go to your chrome://inspect/#devices tab in Chrome
      //  - select "Inspect" on the newly visible item

      // debug version
      // var child = cp['fork'](src, [], {execArgv: ['--inspect-brk']});
      // prod version
      var child = cp['fork'](src);

      child['addEventListener'] = child['addListener'];
      child['removeEventListener'] = child['removeListener'];

      /**
       * fake up postMessage() via send()
       * @param {GeoPackageWorkerMessage} msg
       */
      child['postMessage'] = function(msg) {
        child['send'](msg);
      };

      plugin.geopackage.worker_ = /** @type {!Worker} */ (child);

      goog.log.info(plugin.geopackage.LOGGER, 'GeoPackage worker configured via node child process');
    } else {
      plugin.geopackage.worker_ = new Worker(src);
      plugin.geopackage.worker_.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
        type: plugin.geopackage.MsgType.OPEN_LIBRARY,
        url: (!plugin.geopackage.GPKG_PATH.startsWith('/') ? '../../' : '') + plugin.geopackage.GPKG_PATH
      }));
      goog.log.info(plugin.geopackage.LOGGER, 'GeoPackage worker configured via web worker');
    }
  }

  return plugin.geopackage.worker_;
};
