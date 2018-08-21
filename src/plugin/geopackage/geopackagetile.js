goog.provide('plugin.geopackage.Tile');

goog.require('os.tile.ColorableTile');


/**
 * Implementation of a tile that is colorable.
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @extends {os.tile.ColorableTile}
 * @constructor
 */
plugin.geopackage.Tile = function(tileCoord, state, src, crossOrigin, tileLoadFunction) {
  plugin.geopackage.Tile.base(this, 'constructor', tileCoord, state, src, crossOrigin, tileLoadFunction);
};
goog.inherits(plugin.geopackage.Tile, os.tile.ColorableTile);

/**
 * @inheritDoc
 */
plugin.geopackage.Tile.prototype.dispose = function() {
  var src = this.getImage().src;
  if (src) {
    URL.revokeObjectURL(src);
  }

  plugin.geopackage.Tile.base(this, 'dispose');
};

