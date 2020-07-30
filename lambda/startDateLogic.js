const moment = require('moment-timezone'); // will help us do all the dates math while considering the timezone
const util = require('./util');

module.exports = {
    getStartDateData(day, month, year, timezone) {
        const today = moment().tz(timezone).startOf(day);
        const startDate = moment(`${month}/${day}/${today.year()}`, "MM/DD/YYYY").tz(timezone).startOf('day');
        
        const daysUntilStartDate = Math.ceil(startDate.startOf('day').diff(today, 'days',true)); // same day returns 0
        console.log(today, startDate)
        return {
           daysUntilStartDate:daysUntilStartDate
        }
    },
    createStartDateReminder(daysUntilStartDate, timezone, locale, message) {
        moment.locale(locale);
        const createdMoment = moment().tz(timezone);
        let triggerMoment = createdMoment.startOf('day').add(daysUntilStartDate - 1, 'days');  // set reminder to day before start date

        console.log('Reminder schedule: ' + triggerMoment.format('YYYY-MM-DDTHH:mm:00.000'));

        return util.createReminder(createdMoment, triggerMoment, timezone, locale, message);
    }
}
