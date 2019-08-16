const Api = require('../api.js');
/**
 * Class that can fetch the user id from the account, 
 * necessary to receive withings measurement data
 */
class Account {
    /**
     * initiates accountId and sessionId
     */
    Constructor() {
        this.accountId = 0
        this.sessionId = ''
    }

    /**
     * Sets the accountId and sessionId from the loginresult
     * @param {LoginResult} loginResult the result of the login method
     */
    setAccountAndSessionByLoginResult(loginResult){
        this.accountId = loginResult.accountId
        this.sessionId = loginResult.sessionId
    }

    /**
     * Fetches the user id based on the login, 
     * setAccountAndSessionByLoginResult needs to be called first
     */
    async getUserId(){
        var requestBody = {
            'enrich': 't',
            'recurse_devtype': 1,
            'recurse_use': 7, 
            'listmask': 7,
            'callctx': 'foreground,SyncForTracker,account',
            'action': 'getuserslist',
            'accountid': this.accountId,
            'appname': 'wiscaleNG',
            'appfm': 'ios', 
            'appliver': 4050301,
            'sessionid': this.sessionId
        };
        let promise = new Promise(function(resolve, reject){
            new Api().post('/cgi-bin/account', requestBody).then(
                function(body){
                    if(body.status > 0) {
                        return reject(Error('Server error'));
                    }
                    resolve({
                        userId: body.body.users[0].id
                    })
                }, 
                function(error){
                    return reject(Error('Server error'));
                }
            )
        })

        let result = await promise;
        return result;
    }
}
module.exports = Account