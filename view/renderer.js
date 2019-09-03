const Login = require('../src/withings/login.js')
const Account = require('../src/withings/account.js')
const Activity = require('../src/withings/activity.js')
const GpxGenerator = require('../src/gpxgenerator.js')
const dateFormat = require('dateformat');
const fs = require('fs')
const Preferences = require('../src/preferences')

let login = new Login()
let account = new Account()
let activity = new Activity()
let accountResult = {}
let loginResult = {}
let allActivities = []

let SERVICE_NAME = 'Withings-GPX';
let loginButton = document.getElementById('loginButton');
let emailInputField = document.getElementById('email');
let passwordInputField = document.getElementById('password');

// event handlers
require('electron').ipcRenderer.on('logout', logout)
loginButton.addEventListener('click', startLogin);
emailInputField.addEventListener('keypress', checkKeyAndLogin);
passwordInputField.addEventListener('keypress', checkKeyAndLogin);

document.addEventListener('scroll', checkScrollPositionAndPreloadIfNecessary);

/**
 * Checks how far the users scrolled, if there are only 2 full window heights left
 * to scroll, it will try to preload the next batch of activities
 */
function checkScrollPositionAndPreloadIfNecessary() {
  var scrollY = document.getScroll()[1];
  var totalHeight = document.body.clientHeight;
  var windowHeight = require('electron').remote.getCurrentWindow().getBounds().height;
  if(scrollY > totalHeight - (3 * windowHeight)) {
    getNextBatchOfActivities();
  } 
}

/**
 * Gets the scroll coordinates for the window in [x,y]
 */
document.getScroll = function() {
    var sx, sy, d = document,
        r = d.documentElement,
        b = d.body;
    sx = r.scrollLeft || b.scrollLeft || 0;
    sy = r.scrollTop || b.scrollTop || 0;
    return [sx, sy];
}

// functions
/**
 * checks if the keycode is enter, if so it starts the login function
 * @param {Event} e 
 */
function checkKeyAndLogin(e) {
  if (e.keyCode == 13) {
    startLogin();  
  }
}

/**
 * hides all panels
 */
function hideAllPanels() {
  document.getElementById('login').hidden = true;
  document.getElementById('activitiesDialog').hidden = true;
  document.getElementById('processing').hidden = true;
}

/**
 * checks if the login can automatically sign in with the keychain credentials
 */
async function startAutoLogin() {
  hideAllPanels();
  var autoLoginResult = await login.tryAutoLogin();
  if(autoLoginResult) {
    await getActivities(autoLoginResult);
  }else {
    document.getElementById('login').hidden = false;
  }
}

/**
 * deletes the credentials from the keychain and returns to the login screen
 */
async function logout() {
  await login.deleteCredentials();
  emailInputField.value = '';
  passwordInputField.value = '';

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
  try{
      loginResult = await login.authenticate(true);
  }catch(e){
      document.getElementById('login').hidden = false;
      return;
  }
  await getActivities(loginResult);
}

/**
 * Gets the account info and starts to get the first page of activities
 * @param {LoginResult} loginResult the result of the login 
 * authenticate method
 */
async function getActivities(loginResult){
  account.setAccountAndSessionByLoginResult(loginResult)
  accountResult = await account.getUserId()

  activity.setUserIdAndSessionId(accountResult.userId, loginResult.sessionId);
  getNextBatchOfActivities();
}

/**
 * Gets the next page of activities, adds them to the full list and renders the new ones
 * @param {int} autoLoadIteration number of times it has been trying to recursively load the next page
 */
async function getNextBatchOfActivities(autoLoadIteration){
  document.getElementById('loading').hidden = false;

  //todo: define the maximum range by date pickers, now it is set to 2015
  newActivityResponse = await activity.getNextPageWithActivities(new Date(), new Date(2015,0));

  var newActivities = newActivityResponse.activities;

  //If the response comes out empty, try to load the next batch
  if(newActivities.length === 0 && !newActivityResponse.loading && !newActivityResponse.finished){
    var iteration = 1
    if (autoLoadIteration){
      iteration = autoLoadIteration + 1;
    }
    getNextBatchOfActivities(iteration);
    return;
  }

  allActivities.push.apply(allActivities, newActivities);
  document.getElementById('activitiesDialog').hidden = false;

  //Show and hide the loading or finished state
  if(newActivityResponse.loading || newActivityResponse.finished) {
    document.getElementById('loading').hidden = !newActivityResponse.loading;
    document.getElementById('finished').hidden = !newActivityResponse.finished;
    return;
  } else {
    document.getElementById('loading').hidden = true;
    document.getElementById('finished').hidden = true;
  }

  //Render the new activities, if any
  renderActivities(newActivities);
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

  checkScrollPositionAndPreloadIfNecessary();
}

/**
 * generates an activity element
 * @param {Activity} activity a single activity
 * @return {HTMLElement} acitivity HTML element DIV
 */
function renderActivityDiv(activity) {
  var newDiv = document.createElement('div');
  let startDate = new Date(activity.startdate * 1000);
  let icon = '<div class="icon download"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="15" viewBox="0 0 48 39.5"><g><path class="icon-white" d="M39.1,12a15.5,15.5,0,0,0-28.1-5,12,12,0,0,0,1,24,2,2,0,0,0,0-4,8,8,0,0,1,0-16h.24l.22,0,.17,0,.2-.06.17-.07.18-.1.15-.09a1.07,1.07,0,0,0,.16-.14l.13-.12a.79.79,0,0,0,.12-.15.88.88,0,0,0,.12-.17l.05-.07A11.51,11.51,0,0,1,35.44,14.3v.06a.24.24,0,0,0,0,.08c0,.1,0,.2.07.3l0,.06a2,2,0,0,0,.14.3l0,0a2,2,0,0,0,1.7,1h.21l.1,0A5.17,5.17,0,0,1,38.5,16a5.5,5.5,0,0,1,0,11H37a2,2,0,0,0,0,4h1.5a9.49,9.49,0,0,0,.6-19Z"/><path class="icon-white" d="M29.68,31l-3.39,3.39V20a1.5,1.5,0,0,0-3,0V34.38L19.91,31a1.5,1.5,0,0,0-2.12,2.13l5.94,5.94h0a1.38,1.38,0,0,0,.47.31l0,0a1.62,1.62,0,0,0,.54.1h0a1.47,1.47,0,0,0,.56-.11h0a1.5,1.5,0,0,0,.51-.35l5.93-5.93A1.5,1.5,0,1,0,29.68,31Z"/></g></svg></div>';

  if(activity.isAlreadyDownloaded) {
    icon = '<div class="icon check"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="12" viewBox="0 0 47.83 30.92"><path class="icon-white" d="M18.92,30.92a2,2,0,0,1-1.42-.59L.59,13.41a2,2,0,0,1,0-2.82,2,2,0,0,1,2.82,0l15.51,15.5L44.42.59a2,2,0,0,1,2.83,2.82L20.33,30.33A2,2,0,0,1,18.92,30.92Z"/></svg></div>';
  }
  
  newDiv.innerHTML = '<h3>'
                      + icon
                      + 'Activity started on ' 
                      + dateFormat(startDate, 'dd mm yyyy') 
                      + ' at ' 
                      + dateFormat(startDate, 'HH:MM') + ' </h3>';
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

  const preferences = new Preferences()

  const lastSaveDir = await preferences.getLastSaveDir();

  const options = {
      defaultPath: (lastSaveDir ? lastSaveDir : app.getPath('documents')) + '/' + fileName,
  }

  const { filePath } = await dialog.showSaveDialog(null, options);

  if( filePath ){
      try{
          fs.writeFileSync(filePath, gpxContent, 'utf-8');

          await preferences.updateLastSaveDir(filePath);
      }catch(e){
          alert('failed to save the file: ' + e);
      }
  }
  hideAllPanels();
  document.getElementById('activitiesDialog').hidden = false;
}

startAutoLogin();