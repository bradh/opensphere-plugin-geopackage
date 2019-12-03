/* eslint-disable */
/**
 * @externs
 * @fileoverview Externs for Electron functions exposing a limited Node environment.
 */

/**
 * @type {Object}
 */
var ElectronGpkg = {};

/**
 * Fork a child process.
 * @param {string} modulePath The module to run in the child.
 * @param {Array|undefined} args List of string arguments.
 * @param {Object|undefined} options The process options.
 * @return {!Object} The process.
 */
ElectronGpkg.forkProcess = function(modulePath, args, options) {};

/**
 * Get Electron environment options for use in child processes.
 * @return {!Object}
 */
ElectronGpkg.getElectronEnvOptions = function() {};

/**
 * Resolve a path relative to the OpenSphere base path.
 * @param {string} base The base path.
 * @return {string} The resolved path.
 */
ElectronGpkg.resolveOpenspherePath = function(base) {};

/**
 * Asynchronously remove a file or symbolic link.
 * @param {string} file The file.
 * @param {Function} callback Function to call when the unlink completes.
 */
ElectronGpkg.unlinkFile = function(file, callback) {};
