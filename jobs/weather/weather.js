/**
 * Job: weather
 *
 * Expected configuration:
 *
 * {
 *   "widgetTitle" : "Local Weather",
 *   "interval" : 3600000,
 *
 *   "key" : "apikeygoeshere", // mandatory!
 *   "units": {"metric"|"imperial"}, //  optional
 * 
 *   "lat" : 38.662923,
 *   "lon" : -90.328850,
 *   //    OR
 *   "cityName: montreal,CA",
 * }
 */

module.exports = {

  /**
   * Executed on job initialisation (only once)
   * @param config
   * @param dependencies
   */
  onInit: function (config, dependencies) {

    /*
     This is a good place for initialisation logic, like registering routes in express:

     dependencies.logger.info('adding routes...');
     dependencies.app.route("/jobs/mycustomroute")
     .get(function (req, res) {
     res.end('So something useful here');
     });
     */
  },

  /**
   * Executed every interval
   * @param config
   * @param dependencies
   * @param jobCallback
   */
  onRun: function (config, dependencies, jobCallback) {

    /*
     1. USE OF JOB DEPENDENCIES

     You can use a few handy dependencies in your job:

     - dependencies.easyRequest : a wrapper on top of the "request" module
     - dependencies.request : the popular http request module itself
     - dependencies.logger : atlasboard logger interface

     Check them all out: https://bitbucket.org/atlassian/atlasboard/raw/master/lib/job-dependencies/?at=master

     */

    var logger = dependencies.logger;

    /*

     2. CONFIGURATION CHECK

     You probably want to check that the right configuration has been passed to the job.
     It is a good idea to cover this with unit tests as well (see test/weather file)

     Checking for the right configuration could be something like this:
     */

    if (!config.globalAuth || !(config.globalAuth.weather.openweatherapikey || process.env.WEATHER_OPENWEATHERAPIKEY)) {
      console.log(process.env);
      return jobCallback('missing openweathermap key - see http://openweathermap.org/appid!');
    }
    var apikey = "";
    if (config.globalAuth && !config.globalAuth.weather.openweatherapikey && process.env_WEATHER_OPENWEATHERAPIKEY) {
       apikey = process.env.WEATHER_OPENWEATHERAPIKEY;
    } else {
       apikey = config.globalAuth.weather.openweatherapikey;
    }

    /*
     3. SENDING DATA BACK TO THE WIDGET

     You can send data back to the widget anytime (ex: if you are hooked into a real-time data stream and
     don't want to depend on the jobCallback triggered by the scheduler to push data to widgets)

     jobWorker.pushUpdate({data: { title: config.widgetTitle, html: 'loading...' }}); // on Atlasboard > 1.0


     4. USE OF JOB_CALLBACK

     Using nodejs callback standard conventions, you should return an error or null (if success)
     as the first parameter, and the widget's data as the second parameter.

     This is an example of how to make an HTTP call to google using the easyRequest dependency,
     and send the result to the registered widgets.
     Have a look at test/weather for an example of how to unit tests this easily by mocking easyRequest calls

     */
    var location = "";
    if (config.cityName) {
      location = "&q=" + String(config.cityName) + "";
    } else if (config.lat && config.lon) {
      location = "&lat=" + String(config.lat) + "&lon=" + String(config.lon);
    }

    var key = "&appid=" + String(apikey);

    var units = "&units=metric";
    if (config.units) {
      units = "&units=" + String(config.units);
    }
    var hourcnt;
    if (config.hourCount) {
      hourcnt = "&cnt=" + String(config.hourCount);
    } else {
      hourcnt = "";
    }
    var daycnt = "&cnt="
    if (config.dayCount) {
      daycnt += String(config.dayCount);
    } else {
      daycnt += "10";
    }
    const todayurl = 'http://api.openweathermap.org/data/2.5/forecast?' + key + units + hourcnt + location;
    const dailyurl = 'http://api.openweathermap.org/data/2.5/forecast/daily?' + key + units + daycnt + location;
    dependencies.easyRequest.JSON(todayurl,
      function (err, hourlyRes) {
        console.log(dailyurl);
        dependencies.easyRequest.JSON(
          dailyurl,
          function (err, dailyRes) {
            jobCallback(err, {
              title: config.widgetTitle, hourlyContent: hourlyRes, dailyContent: dailyRes,
              hourCount: config.hourCount, dayCount: config.dayCount
            });
          });
      });
  }
};
