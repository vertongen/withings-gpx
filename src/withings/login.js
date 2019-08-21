const crypto = require('crypto');
const Api = require('../api.js');
const Keytar = require('keytar');

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

    async tryAutoLogin(){
        var credentials = await Keytar.findCredentials(SERVICE_NAME);

        if(credentials.length > 0) {
            this.email = credentials[0].account;
            this.password = credentials[0].password;
            var result = await this.authenticate(false);
            return result;
        }

        return null;        
    }

    async deleteCredentials() { 
        var credentials = await Keytar.findCredentials(SERVICE_NAME);
        credentials.forEach( async function(credential) {
            await Keytar.deletePassword(SERVICE_NAME, credential.account);
        });
    }

    /**
     * authenticates with the email and password
     */
    async authenticate(saveCredentials){

        let passwordHash = crypto.createHash('md5')
                            .update(this.password).digest("hex")

        if(saveCredentials) {
            Keytar.setPassword(SERVICE_NAME, this.email, this.password)
        }
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