const Login = require('../src/withings/login.js')
const Account = require('../src/withings/account.js')
const Activity = require('../src/withings/activity.js')
const GpxGenerator = require('../src/gpxgenerator.js')
const dateFormat = require('dateformat');
const fs = require('fs')
require('electron').ipcRenderer.on('logout', logout);

let login = new Login()
let account = new Account()
let activity = new Activity();

let SERVICE_NAME = 'Withings-GPX'

document.getElementById('loginButton').addEventListener('click', function(){
  startLogin()
})

function hideAllPanels() {
  document.getElementById('login').hidden = true;
  document.getElementById('activitiesDialog').hidden = true;
  document.getElementById('processing').hidden = true;
}

async function startAutoLogin() {
  hideAllPanels();
  var autoLoginResult = await login.tryAutoLogin();
  if(autoLoginResult) {
    await getActivities(autoLoginResult);
  }else {
    document.getElementById('login').hidden = false;
  }
}

async function logout() {
  await login.deleteCredentials();
  hideAllPanels();
  document.getElementById('login').hidden = false;
}

/**
 * fetches the login and password from the UI,
 * if the login is successful, it will get the activities
 */
async function startLogin(){
  hideAllPanels();
  login.email = document.getElementById('email').value;
  login.password = document.getElementById('password').value;
  var loginResult = {}
  try{
      loginResult = await login.authenticate(true);
  }catch(e){
      document.getElementById('login').hidden = false;
      return;
  }
  await getActivities(loginResult);
}

/**
 * Gets the account info and all activities from the past 30 days
 * @param {LoginResult} loginResult the result of the login 
 * authenticate method
 */
async function getActivities(loginResult){
  account.setAccountAndSessionByLoginResult(loginResult)
  let accountResult = await account.getUserId()

  activity.setUserIdAndSessionId(accountResult.userId, loginResult.sessionId);
  let allActivities = await activity.getAllActivitiesInLast30Days();


  document.getElementById('activitiesDialog').hidden = false;
  renderActivities(allActivities);
}

/**
 * Renders the list of activities in the UI
 * @param {[Activity]} allActivities list of activities
 */
function renderActivities(allActivities){
  let activityDiv = document.getElementById('activities')
  allActivities.forEach(function(activity){
    var newDiv = renderActivityDiv(activity);
    newDiv.addEventListener('click', function(){
      var selectedActivity = allActivities
                              .filter(a => a.id === Number(newDiv.dataset.activityId))[0];
      generateGpx(selectedActivity);
      hideAllPanels();
      document.getElementById('processing').hidden = false;
    })

    activityDiv.appendChild(newDiv)
  });
}

/**
 * generates an activity element
 * @param {Activity} activity a single activity
 * @return {HTMLElement} acitivity HTML element DIV
 */
function renderActivityDiv(activity) {
  var newDiv = document.createElement('div');
  let startDate = new Date(activity.startdate * 1000);
  newDiv.innerHTML = '<h3>Activity started on ' 
                      + dateFormat(startDate, 'dd mm yyyy') 
                      + ' at ' 
                      + dateFormat(startDate, 'HH:MM') + ' <h3>';
  newDiv.innerHTML += '<div class="info maxheartrate"><div class="label">'
                      + 'average HR</div><div class="value">' 
                      + activity.data.hr_average 
                      + '<span>bpm</span></div></div>';
  newDiv.innerHTML += '<div class="info minheartrate"><div class="label">' 
                      + 'average speed</div><div class="value">' 
                      + Math.round(activity.gps.avg_speed * 3.6 * 100) / 100 
                      + '<span>km/h</span></div></div>';
  newDiv.innerHTML += '<div class="info distance"><div class="label">' 
                      + 'distance</div><div class="value">' 
                      + Math.round((activity.gps.distance) / 10) / 100 
                      + '<span>km</span></div></div>';
  newDiv.innerHTML += '<div class="info calories"><div class="label">'
                      + 'calories</div><div class="value">' 
                      + Math.round(activity.data.manual_calories) 
                      + '<span>kcal</span></div></div>';
  newDiv.dataset.activityId = activity.id;
  return newDiv;
}

/**
 * Generates a GPX file and opens the save dialog
 * @param {Activity} selectedActivity 
 */
async function generateGpx(selectedActivity){
  let gpxContent = await (new GpxGenerator())
                    .generateGpxFromActivity(selectedActivity)
  let startDate = new Date(selectedActivity.startdate*1000);
  var fileName = 'activity_' 
                + dateFormat(startDate, 'ddmmyyyy_HHMM') 
                + '.gpx'
  const { dialog, app }  = require('electron').remote
  const options = {
      defaultPath: app.getPath('documents') + '/' + fileName,
  }
  dialog.showSaveDialog(null, options, (path) => {
      if(path){
      try{
          fs.writeFileSync(path, gpxContent, 'utf-8');
      }catch(e){
          alert('failed to save the file: ' + e);
      }
      }
      hideAllPanels();
      document.getElementById('activitiesDialog').hidden = false;
  });
}

startAutoLogin();