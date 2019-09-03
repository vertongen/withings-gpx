const storage = require('electron-json-storage');

const path = require('path');
const util = require('util');


class Preferences {

    async static getLastSaveDir() {
        return util.promisify(storage.get)('LAST_SAVE_DIR')
    }

    async static updateLastSaveDir(filePath) {
        const directoryPath = path.dirname(filePath);

        await util.promisify(storage.set)('LAST_SAVE_DIR', directoryPath)
    }
}

module.exports = Preferences;