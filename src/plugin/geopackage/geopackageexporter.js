goog.provide('plugin.geopackage.Exporter');

goog.require('goog.log');
goog.require('ol.format.GeoJSON');
goog.require('os.data.RecordField');
goog.require('os.ex.AbstractExporter');
goog.require('os.map');


/**
 * The GeoPackage exporter.
 * @extends {os.ex.AbstractExporter<ol.Feature>}
 * @constructor
 */
plugin.geopackage.Exporter = function() {
  plugin.geopackage.Exporter.base(this, 'constructor');
  this.log = plugin.geopackage.Exporter.LOGGER_;
  this.format = new ol.format.GeoJSON();

  /**
   * @type {!Object<string, null>}
   * @private
   */
  this.tables_ = {};

  /**
   * @type {!Object<string, string>}
   * @private
   */
  this.idsToTables_ = {};

  /**
   * @type {string}
   * @protected
   */
  this.lastId = '';

  this.workerHandler_ = this.onMessage.bind(this);
};
goog.inherits(plugin.geopackage.Exporter, os.ex.AbstractExporter);


/**
 * @type {number}
 */
plugin.geopackage.Exporter.ID_ = 0;


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.geopackage.Exporter.LOGGER_ = goog.log.getLogger('plugin.geopackage.Exporter');


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.getLabel = function() {
  return 'GeoPackage';
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.getExtension = function() {
  return 'gpkg';
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.getMimeType = function() {
  return 'application/x-sqlite3';
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.isAsync = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.supportsMultiple = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.reset = function() {
  plugin.geopackage.Exporter.base(this, 'reset');
  if (this.gpkg_) {
    this.gpkg_.close();
  }
  this.gpkg_ = null;
  this.tables_ = {};
  this.idsToTables_ = {};
  plugin.geopackage.Exporter.ID_++;

  var worker = plugin.geopackage.getWorker();
  worker.removeEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);
};


/**
 * @param {!string} errorMsg
 * @private
 */
plugin.geopackage.Exporter.prototype.reportError_ = function(errorMsg) {
  var msg = 'Error creating ' + this.getLabel() + ' file: ' + errorMsg;
  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, this.log);

  if (this.gpkg_) {
    this.gpkg_.close();
  }

  this.dispatchEvent(os.events.EventType.ERROR);
};

/**
 * @inheritDoc
 */
plugin.geopackage.Exporter.prototype.process = function() {
  var worker = plugin.geopackage.getWorker();
  worker.addEventListener(goog.events.EventType.MESSAGE, this.workerHandler_);

  this.lastId = 'export' + plugin.geopackage.Exporter.ID_;
  this.exportCommand(plugin.geopackage.ExportCommands.CREATE);
};


/**
 * @param {Event|GeoPackageWorkerResponse} e
 * @protected
 */
plugin.geopackage.Exporter.prototype.onMessage = function(e) {
  var msg = /** @type {GeoPackageWorkerResponse} */ (e instanceof window.Event ? e.data : e);

  if (msg && msg.message.id === this.lastId && msg.message.type === plugin.geopackage.MsgType.EXPORT) {
    if (msg.type === plugin.geopackage.MsgType.SUCCESS) {
      if (msg.message.command === plugin.geopackage.ExportCommands.CREATE) {
        this.index_ = 0;
      } else if (msg.message.command === plugin.geopackage.ExportCommands.CREATE_TABLE) {
        this.tables_[/** @type {!string} */ (msg.message.tableName)] = null;
      } else if (msg.message.command === plugin.geopackage.ExportCommands.GEOJSON) {
        this.index_++;
      }

      if (msg.message.command === plugin.geopackage.ExportCommands.WRITE) {
        this.output = [];
        this.exportCommand(plugin.geopackage.ExportCommands.GET_CHUNK);
      } else if (msg.message.command === plugin.geopackage.ExportCommands.GET_CHUNK) {
        if (msg.data instanceof ArrayBuffer) {
          this.output = msg.data;
          this.exportCommand(plugin.geopackage.ExportCommands.WRITE_FINISH);
        } else if (msg.data && msg.data.length) {
          this.output = this.output.concat(msg.data);
          this.exportCommand(plugin.geopackage.ExportCommands.GET_CHUNK);
        } else {
          this.exportCommand(plugin.geopackage.ExportCommands.WRITE_FINISH);
        }
      } else if (msg.message.command === plugin.geopackage.ExportCommands.WRITE_FINISH) {
        if (!(this.output instanceof ArrayBuffer)) {
          this.output = Uint8Array.from(/** @type {!Array<!number>} */ (this.output)).buffer;
        }

        // remove it
        var electron = plugin.geopackage.getElectron();
        if (electron) {
          electron.unlinkFile('tmp.gpkg', function(err) {
            if (err) {
              goog.log.error(plugin.geopackage.Exporter.LOGGER_, 'Could not delete tmp.gpkg!');
            } else {
              goog.log.info(plugin.geopackage.Exporter.LOGGER_, 'Removed tmp.gpkg');
            }
          });
        }

        this.dispatchEvent(os.events.EventType.COMPLETE);
      } else {
        this.parseNext_();
      }
    } else {
      this.reportError_('GeoPackage creation failed! ' + msg.reason);
    }
  }
};


/**
 * @param {plugin.geopackage.ExportCommands} cmd
 * @protected
 */
plugin.geopackage.Exporter.prototype.exportCommand = function(cmd) {
  var worker = plugin.geopackage.getWorker();
  worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
    id: this.lastId,
    type: plugin.geopackage.MsgType.EXPORT,
    command: cmd
  }));
};


/**
 * @param {os.data.ColumnDefinition} colDef
 * @return {{field: string, type: string}}
 */
plugin.geopackage.Exporter.mapColumnDefToColumn = function(colDef) {
  return {
    'field': colDef.field,
    'type': colDef.type
  };
};


/**
 * @private
 */
plugin.geopackage.Exporter.prototype.parseNext_ = function() {
  var worker = plugin.geopackage.getWorker();

  if (this.index_ === this.items.length) {
    this.exportCommand(plugin.geopackage.ExportCommands.WRITE);
    return;
  }

  var feature = this.items[this.index_];
  var source = this.getSource_(feature);
  if (!source) {
    this.reportError_('Could not determine source for ' + feature.getId());
    return;
  }

  var id = source.getId();
  var tableName;

  if (id in this.idsToTables_) {
    tableName = this.idsToTables_[id];
  } else {
    tableName = /** @type {!os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(id)).getTitle();
    this.idsToTables_[id] = tableName;
  }

  if (!tableName) {
    this.reportError_('Could not determine table name for ' + feature.getId());
    return;
  }

  if (!(tableName in this.tables_)) {
    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.lastId,
      type: plugin.geopackage.MsgType.EXPORT,
      command: plugin.geopackage.ExportCommands.CREATE_TABLE,
      columns: source.getColumns().map(plugin.geopackage.Exporter.mapColumnDefToColumn),
      tableName: tableName
    }));
    return;
  }

  var geojson = this.format.writeFeatureObject(feature, {
    featureProjection: os.map.PROJECTION,
    dataProjection: os.proj.EPSG4326,
    fields: this.fields
  });

  var props = geojson['properties'];

  var itime = feature.get(os.data.RecordField.TIME);
  if (itime) {
    props[plugin.geopackage.Exporter.RECORD_TIME_START_FIELD] = new Date(itime.getStart()).toISOString();

    if (itime instanceof os.time.TimeRange) {
      props[plugin.geopackage.Exporter.RECORD_TIME_STOP_FIELD] = new Date(itime.getEnd()).toISOString();
    }
  }

  worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
    id: this.lastId,
    type: plugin.geopackage.MsgType.EXPORT,
    command: plugin.geopackage.ExportCommands.GEOJSON,
    tableName: tableName,
    data: geojson
  }));
};



/**
 * @type {string}
 * @const
 */
plugin.geopackage.Exporter.RECORD_TIME_START_FIELD = 'TIME_START';


/**
 * @type {string}
 * @const
 */
plugin.geopackage.Exporter.RECORD_TIME_STOP_FIELD = 'TIME_STOP';


/**
 * @param {ol.Feature} feature The feature
 * @return {?os.source.Vector}
 * @private
 */
plugin.geopackage.Exporter.prototype.getSource_ = function(feature) {
  if (feature) {
    var sourceId = feature.get(os.data.RecordField.SOURCE_ID);
    if (goog.isString(sourceId)) {
      return /** @type {os.source.Vector} */ (os.osDataManager.getSource(sourceId));
    }
  }

  return null;
};
