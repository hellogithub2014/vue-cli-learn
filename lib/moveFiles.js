const fs = require('fs');
const path = require('path');
const glob = require('glob');
const fsExtra = require('fs-extra');

module.exports = function(srcFolder, destFolder) {
  return new Promise((resolve, reject) => {
    // fs.copyFile(src, dest, err => {
    //   const list = glob.sync(`${srcFolder}/*`);
    //   list.forEach(name => {});
    // });
    fsExtra.copy(srcFolder, destFolder, err => {
      if (err) {
        reject(err);
      } else {
        console.log(`move files success`);

        resolve();
      }
    });
  }).then(_ => {
    return fsExtra.remove(
      srcFolder
        .split('/')
        .slice(0, -1)
        .join('/'),
    );
  });
};
