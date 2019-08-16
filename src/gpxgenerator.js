/**
 * The class converts the withings data into a GPX file
 */
class GpxGenerator {
    
    /**
     * This method fetches the details of the activity 
     * and generates a GPX file
     * @param {Activity} selectedActivity the activity 
     * received from allActivities
     */
    async generateGpxFromActivity(selectedActivity){
        console.log(selectedActivity);
        let heartrateData = await activity
                            .getHeartrateData(selectedActivity.startdate, selectedActivity.enddate);
        let locationData = await activity
                            .getLocationData(selectedActivity.startdate, selectedActivity.enddate);
        return this.generateGpx(locationData, heartrateData);
    }

    /**
     * This method generates a GPX file
     * @param {object} locationData The locationdata received from withings
     * @param {object} heartrateData The heartrate data received from withings
     * @return {string} contents of the GPX file
     */
    generateGpx(locationData, heartrateData){
        var result = '<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1/gpx.xsd"><trk><name>test</name><trkseg>';
        
        for(var i = 0; i < locationData.vasistas.length; i++){
            let timestamp = locationData.dates[i];
            let latitude = locationData.vasistas[i][0];
            let longitude = locationData.vasistas[i][1];
            result += '<trkpt lat="' + latitude + '" lon="' + longitude + '"><time>';
            result += new Date(timestamp*1000).toISOString();
            result += '</time>';
            
            var heartrateDelta = 99999;
            var heartrate = 0;

            for(var j = 0; j < heartrateData.dates.length; j++){
                let heartrateTime = heartrateData.dates[j]
                let delta = Math.abs(timestamp - heartrateTime);
                if(delta < heartrateDelta){
                    heartrateDelta = delta;
                    heartrate = heartrateData.vasistas[j][0];
                }
            }
            if(heartrateDelta < 10){
                result += '<extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>';
                result += heartrate;
                result += '</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>';
            }

            result += '</trkpt>';
        }
        result += '</trkseg></trk></gpx>';
        return result;
    }
}
module.exports = GpxGenerator