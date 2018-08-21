/**
 * @fileoverview Externs for ngageoint/geopackage 1.0.24
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
 *  columns: ({field: string, type: string}|undefined)
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

/**
 * @type {Object}
 * @const
 */
var geopackage = {};

/**
 * @param {string} path Path where geopackage exists
 * @param {function(*, GeoPackage):*} callback Called with `err, geopackage`
 */
geopackage.openGeoPackage = function(path, callback) {};

/**
 * @param {Uint8Array} array Array of GeoPackage bytes
 * @param {function(*, GeoPackage):*} callback Called with `err, geopackage`
 */
geopackage.openGeoPackageByteArray = function(array, callback) {};


/**
 * @param {string} path The path
 * @param {function(*, GeoPackage):*} callback Called with `err, geopackage`
 */
geopackage.createGeoPackage = function(path, callback) {};


/**
 * @param {GeoPackage} gpkg The GeoPackage
 * @param {string} tableName The table name
 * @param {function(*, Object, function())} featureCallback The callback for each GeoJSON feature
 * @param {function(*)} doneCallback The callback when the iteration finishes
 */
geopackage.iterateGeoJSONFeaturesFromTable = function(gpkg, tableName, featureCallback, doneCallback) {};


/**
 * @param {GeoPackage} gpkg The GeoPackage
 * @param {Object} feature The GeoJSON feature to add
 * @param {string} tableName The tableName to which to add the feature
 * @param {function(*):*} callback Called with `err`
 */
geopackage.addGeoJSONFeatureToGeoPackage = function(gpkg, feature, tableName, callback) {};

/**
 * @param {GeoPackage} gpkg
 * @param {string} tableName
 * @param {geopackage.GeometryColumns} geometryColumns
 * @param {Array<geopackage.FeatureColumn>} columns
 * @param {function(*, GeoPackage.FeatureDao):*} callback
 */
geopackage.createFeatureTable = function(gpkg, tableName, geometryColumns, columns, callback) {};


/**
 * @constructor
 */
var GeoPackage;

/**
 * Close the database connection
 */
GeoPackage.prototype.close = function() {};

/**
 * @param {function(*, Uint8Array):*} callback Called with `err, data`
 */
GeoPackage.prototype.export = function(callback) {};

/**
 * @return {string} The name
 */
GeoPackage.prototype.getName = function() {};

/**
 * @return {string} The path
 */
GeoPackage.prototype.getPath = function() {};

/**
 * @param {function(*, Array<!string>):*} callback Called with `err, tableNames`
 */
GeoPackage.prototype.getFeatureTables = function(callback) {};

/**
 * @param {!string} table The table name
 * @param {function(*, GeoPackage.FeatureDao):*} callback Called with `err, featureDao`
 */
GeoPackage.prototype.getFeatureDaoWithTableName = function(table, callback) {};

/**
 * @param {!string} tableName The name of the tile table to find
 * @param {function(*, GeoPackage.TileDao):*} callback Called with `err, TileDao`
 */
GeoPackage.prototype.getTileDaoWithTableName = function(tableName, callback) {};

/**
 * @param {function(*, Array<!string>):*} callback Called with `err, tableNames`
 */
GeoPackage.prototype.getTileTables = function(callback) {};

/**
 * @param {GeoPackage.TileDao|GeoPackage.FeatureDao} tableDao The table data access object
 * @param {function(*, Object<string, *>):*} callback Called with `err, info`
 */
GeoPackage.prototype.getInfoForTable = function(tableDao, callback) {};


/**
 * @constructor
 */
GeoPackage.TileDao;

/**
 * @type {string}
 */
GeoPackage.TileDao.prototype.table_name;

/**
 * @type {Array<?GeoPackage.TileMatrix>}
 */
GeoPackage.TileDao.prototype.zoomLevelToTileMatrix;

/**
 * @param {number} x The tile column
 * @param {number} y The tile row
 * @param {number} z The zoom level
 * @param {function(*, GeoPackage.Tile):*} callback Called with `err, tile`
 */
GeoPackage.TileDao.prototype.queryForTile = function(x, y, z, callback) {};


/**
 * @constructor
 */
GeoPackage.Tile;

/**
 * @return {Uint8Array} The byte data for the tile
 */
GeoPackage.Tile.prototype.getTileData = function() {};


/**
 * @constructor
 */
geopackage.GeometryColumns;

/**
 * @type {string}
 */
geopackage.GeometryColumns.prototype.table_name;

/**
 * @type {string}
 */
geopackage.GeometryColumns.prototype.column_name;

/**
 * @type {string}
 */
geopackage.GeometryColumns.prototype.geometry_type_name;

/**
 * @type {number}
 */
geopackage.GeometryColumns.prototype.z;

/**
 * @type {number}
 */
geopackage.GeometryColumns.prototype.m;


/**
 * @constructor
 */
geopackage.FeatureColumn;

/**
 * @param {number} index The index
 * @param {string} name The column name
 * @return {geopackage.FeatureColumn}
 */
geopackage.FeatureColumn.createPrimaryKeyColumnWithIndexAndName = function(index, name) {};

/**
 * @param {number} index The index
 * @param {string} columnName The column name
 * @param {string} geometryTypeName The geometry type name
 * @param {boolean} notNull
 * @param {*} defaultValue
 * @return {geopackage.FeatureColumn}
 */
geopackage.FeatureColumn.createGeometryColumn = function(index, columnName, geometryTypeName, notNull, defaultValue) {};

/**
 * @param {number} index The index
 * @param {string} columnName The column name
 * @param {number} dataType
 * @param {boolean} notNull
 * @param {*} defaultValue
 * @return {geopackage.FeatureColumn}
 */
geopackage.FeatureColumn.createColumnWithIndex = function(index, columnName, dataType, notNull, defaultValue) {};


/**
 * @typedef {{
 *  table_name: string
 * }}
 */
GeoPackage.FeatureDao;


/**
 * @typedef {{
 *   table_name: string,
 *   zoom_level: number,
 *   matrix_height: number,
 *   matrix_width: number,
 *   tile_height: number,
 *   tile_width: number,
 *   pixel_x_size: number,
 *   pixel_y_size: number
 * }}
 */
GeoPackage.TileMatrix;

