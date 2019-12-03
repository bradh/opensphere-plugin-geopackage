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
 * Get the Electron preload exports.
 * @return {Object|undefined}
 */
plugin.geopackage.getElectron = function() {
  return window.ElectronGpkg || undefined;
};


/**
 * If the app is running within Electron.
 * @return {boolean}
 */
plugin.geopackage.isElectron = function() {
  return !!plugin.geopackage.getElectron();
};


/**
 * @return {!Worker} The GeoPackage worker
 */
plugin.geopackage.getWorker = function() {
  if (!plugin.geopackage.worker_) {
    var src = plugin.geopackage.ROOT + 'src/worker/gpkg.worker.js';

    var electron = plugin.geopackage.getElectron();
    if (electron) {
      // The node context (as opposed to the electron browser context), loads
      // paths relative to process.cwd(). Therefore, we need to make our source
      // path absolute.
      src = electron.resolveOpenspherePath(src);

      // spawn a child process and make it look like a worker

      // CLEVER HACK ALERT!
      // The child process has a node-only environment by default, rather than an Electron
      // environment. However, electron-builder only packages the version built for the
      // Electron environment.
      //
      // Therefore, pass the electron version to the script via an env variable so that
      // it can know that we intend to load Electron bindings for native modules rather
      // than node bindings.
      //
      // see associated hack in gpkg.worker.js
      var options = electron.getElectronEnvOptions();

      // to debug this guy:
      //  - open chrome://inspect/#devices
      //  - uncomment the debug option below
      //  - open the application
      //  - go to your chrome://inspect/#devices tab in Chrome
      //  - select "Inspect" on the newly visible item

      // DEBUG VERSION! Do not commit next line uncommented
      // options['execArgv'] = ['--inspect-brk'];
      var child = electron.forkProcess(src, [], options);

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
