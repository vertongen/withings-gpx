const crypto = require('crypto');
const Api = require('../api.js');

/**
 * This is the start of the withings flow, 
 * first authenticate with username and password
 */
class Login {
    /**
     * inits email and password
     */
    Constructor() {
        this.email = ''
        this.password = ''
    }

    /**
     * authenticates with the email and password
     */
    async authenticate(){
        let passwordHash = crypto.createHash('md5')
                            .update(this.password).digest("hex")
        var requestBody = {
            'email': this.email,
            'duration': 900,
            'hash': passwordHash, 
            'callctx': 'foreground',
            'action': 'login',
            'appname': 'wiscaleNG',
            'appfm': 'ios', 
            'appliver': 4050301
            };
        let promise = new Promise(function(resolve, reject){
            new Api().post('/cgi-bin/auth', requestBody).then(
                function(body){
                    console.log(body)
                    if(body.status === 100){
                        return reject(new Error('Authenication failed'));
                    }
                    if(body.status > 0) {
                        return reject(new Error('Server error'));
                    }
                    resolve({
                        sessionId: body.body.sessionid,
                        accountId: body.body.account[0].id
                    })
                }, 
                function(error){
                    console.log(error)
                    return reject(new Error('Server error'));
                }
            )
        })
        let result = await promise;
        return result;
    }
}
module.exports = Login