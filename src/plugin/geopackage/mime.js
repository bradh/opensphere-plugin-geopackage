goog.provide('plugin.geopackage.mime');

goog.require('goog.Promise');
goog.require('os.file.mime');


/**
 * @type {string}
 * @const
 */
plugin.geopackage.mime.TYPE = 'application/vnd.opengeospatial.geopackage+sqlite3';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.geopackage.mime.detect = function(buffer, file, opt_context) {
  var retVal = false;

  var str = 'SQLite format 3';
  if (file && file.getFileName() && /\.gpkg$/.test(file.getFileName()) &&
    buffer && buffer.byteLength > str.length && String.fromCharCode(
      ...new Uint8Array(buffer).slice(0, str.length)) === str) {
    retVal = true;
  }

  return /** @type {!goog.Promise<*|undefined>} */ (goog.Promise.resolve(retVal));
};


os.file.mime.register(plugin.geopackage.mime.TYPE, plugin.geopackage.mime.detect);
