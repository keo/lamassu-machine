'use strict';

var fs = require('fs');
var zlib = require('zlib');
var async = require('./async');
var cp = require('child_process');
var report = require('./report').report;
var tar = require('/opt/apps/machine/lamassu-machine/node_modules/tar');

var TIMEOUT = 10000;

var hardwareCode = process.argv[2] || 'N7G1';

function command(cmd, cb) {
  cp.exec(cmd, {timeout: TIMEOUT}, function(err) {
    cb(err);
  });
}

function remountRW(cb) {
  if (hardwareCode !== 'N7G1') return cb();
  command('/bin/mount -o remount,rw /', cb);
}

function untar(tarball, outPath, cb) {
  var fileIn = fs.createReadStream(tarball);
  fileIn.pipe(zlib.createGunzip()).pipe(tar.Extract(outPath))
  .on('error', cb)
  .on('end', cb);   // success
}

async.series([
  async.apply(remountRW),
  async.apply(command, 'mkdir -p /opt/apps/machine'),
  async.apply(untar, '/tmp/extract/package/subpackage.tgz', '/tmp/extract/package/'),
  async.apply(command, 'cp -a /tmp/extract/package/subpackage/* /opt/apps/machine/ui/css/fonts'),
  async.apply(report, null, 'finished.')
], function(err) {
  if (err) throw err;
});
