/**
 * @fileoverview Externs for interacting with src/worker/gpkg.worker.js
 * @externs
 */


/**
 * @typedef {{
 *  id: !string,
 *  type: !string,
 *  data: (ArrayBuffer|Object|undefined),
 *  tileCoord: (Array<number>|undefined),
 *  tableName: (string|undefined),
 *  url: (string|undefined),
 *  columns: ({field: string, type: string}|undefined),
 *  command: (string|undefined)
 * }}
 */
var GeoPackageWorkerMessage;

/**
 * @typedef {{
 *  message: !GeoPackageWorkerMessage,
 *  type: !string,
 *  data: *,
 *  reason: (string|undefined)
 * }}
 */
var GeoPackageWorkerResponse;
