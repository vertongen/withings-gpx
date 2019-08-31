const Api = require('../api.js');
const dateFormat = require('dateformat');
/**
 * Class that can receive the activities 
 * and their details (heartrate and location)
 */
class Activity {
    /**
     * initiates user id and session id
     */
    Constructor() {
        this.userId = 0
        this.sessionId = ''
    }

    /**
     * This method needs to be called first
     * @param {int} userId Sets the userId that will be 
     * used in the requests
     * @param {string} sessionId Sets the sessionId that 
     * will be used in the requests
     */
    setUserIdAndSessionId(userId, sessionId){
        this.userId = userId
        this.sessionId = sessionId
    }

    /**
     * Fetches all activities from the last 30 days
     */
    async getAllActivitiesInLast30Days(){
        let today = new Date();
        let lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate()-30);
        return this.getAllActivities(lastMonth, today)
    }

    /**
     * Gets the next page of activities, 
     * startDate and endDate should always be the same when requesting data
     * The class keeps track of the pages itself. 
     * @param {Date} startDate 
     * @param {Date} endDate 
     * @return {Object} with properties loading, finished & activities
     */
    async getNextPageWithActivities(startDate, endDate){
        if(this.isLoading === true){
            return {
                loading: true,
                finished: false,
                activities: []
            }
        }
        
        if (this.currentStartDate){
            this.currentStartDate.setDate(this.currentStartDate.getDate()-30);
        } else {
            this.currentStartDate = startDate;
        }

        if (this.currentStartDate < endDate) {
            return {
                loading: false,
                finished: true,
                activities: []
            }
        }
        let startDateMin30Days = new Date(this.currentStartDate.getTime());
        startDateMin30Days.setDate(this.currentStartDate.getDate()-30);
        if(startDateMin30Days < endDate) {
            startDateMin30Days = endDate;
        }
        let activities = await this.getAllActivities(startDateMin30Days, this.currentStartDate)
        return {
            loading: false,
            finished: false,
            activities: activities
        };
    }

    /**
     * Fetches all activities between startdate and enddate
     * @param {Date} startDate start date to filter on
     * @param {Date} endDate end date to filter on
     */
    async getAllActivities(startDate, endDate){
        this.isLoading = true;
        var requestBody = {
            'action':'getbyuserid',
            'userid': this.userId,
            'startdateymd': dateFormat(startDate, 'yyyy-mm-dd'),
            'enddateymd': dateFormat(endDate, 'yyyy-mm-dd'),
            'callctx':'foreground',
            'appname':'wiscaleNG',
            'apppfm':'ios',
            'appliver':4050301,
            'sessionid':this.sessionId
        };
        let that = this;
        let promise = new Promise(function(resolve, reject){
            new Api().post('/cgi-bin/v2/activity', requestBody).then(
                function(body){
                    if(body.status > 0) {
                        return reject(new Error('Server error'));
                    }
                    
                    var activitiesToSelectfrom = 
                        body.body.series
                                    .filter(a => a.gps !== null)
                                    .sort((a,b) => b.startdate - a.startdate);
                    resolve(activitiesToSelectfrom)
                    that.isLoading = false;
                }, 
                function(error){
                    return reject(new Error('Server error'));
                }
            )
        })

        let result = await promise;
        return result;
    }

    /**
     * Fetches the heartrate data for the first activity 
     * between starttime and endtime
     * The best idea is to first fetch all activities 
     * and use that starttime and endtime
     * @param {int} startTime epoch timestamp
     * @param {int} endTime epoch timestamp
     */
    async getHeartrateData(startTime, endTime) {
        var requestBody = {
            'action':'getvasistas',
            'userid':this.userId,
            'startdate': startTime,
            'enddate': endTime,
            'callctx':'foreground',
            'meastype':'11,43,73,89',
            'vasistas_category':'hr',
            'appname':'wiscaleNG',
            'apppfm':'ios',
            'appliver':4050301,
            'sessionid': this.sessionId
        };
        let promise = new Promise(function(resolve, reject){
            new Api().post('/cgi-bin/v2/measure', requestBody).then(
                function(body){
                    if(body.status > 0) {
                        return reject(new Error('Server error'));
                    }
                    resolve(body.body.series[0])
                }, 
                function(error){
                    return reject(new Error('Server error'));
                }
            )
        })

        let result = await promise;
        return result;
    }

    /**
     * Fetches the location data for the first activity 
     * between starttime and endtime
     * The best idea is to first fetch all activities 
     * and use that starttime and endtime
     * @param {int} startTime epoch timestamp
     * @param {int} endTime epoch timestamp
     */
    async getLocationData(startTime, endTime) {
        var requestBody = {
            'action':'getvasistas',
            'userid':this.userId,
            'startdate': startTime,
            'enddate': endTime,
            'callctx':'foreground',
            'meastype':'98,99,97,72,96,101,100',
            'vasistas_category':'location',
            'appname':'wiscaleNG',
            'apppfm':'ios',
            'appliver':4050301,
            'sessionid': this.sessionId
        };
        let promise = new Promise(function(resolve, reject){
            new Api().post('/cgi-bin/v2/measure', requestBody).then(
                function(body){
                    if(body.status > 0) {
                        return reject(new Error('Server error'));
                    }
                    resolve(body.body.series[0])
                }, 
                function(error){
                    return reject(new Error('Server error'));
                }
            )
        })

        let result = await promise;
        return result;
    }
}
module.exports = Activity