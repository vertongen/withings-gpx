const querystring = require('querystring');
const https = require('https');

/**
 * A helper class to make easier calls to the withings API
 */
class Api {

    /**
     * This method executes a POST call to the API 
     * and returns a Promise
     * @param {string} method the url method to call
     * @param {any} body the body object to send
     * @return {Promise} a promise for the result
     */
    post(method, body){

        var postData = querystring.stringify(body);

        var options = {
        hostname: 'scalews.withings.net',
        port: 443,
        path: method,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
        };

        return new Promise(function(resolve, reject){
            var req = https.request(options, (res) => {
            res.setEncoding('utf8');
            var result = ''
            res.on('data', (d) => {
                result += d;
                });
                res.on('end', () => {
                    resolve(JSON.parse(result));
                })  
            });
            
    
            req.on('error', (e) => {
                reject(e);
            });    
            req.write(postData);
            req.end();
        })
    }
}
module.exports = Api