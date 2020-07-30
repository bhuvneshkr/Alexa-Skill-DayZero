// index.js
// ========

const Alexa = require('ask-sdk-core');
const languageStrings = require('./message.js');
const i18n = require('i18next');
const utility = require('./util.js')
const util = require('./util'); //utility functions
const constants = require('./constants');
const startDateLogic = require('./startDateLogic');

console.log('getting persistenceAdaper');
let USE_DYNAMO = true;     // ENABLE THIS TO INSTANTIATE DYNAMODB
let persistenceAdapter = getPersistenceAdapter();

/**
 * Creates an instance of a persistenceAdapter. This allows us to store persistent data that
 * will not be lost when quitting the skill. User role  (New Hire or Current Amazonian) will be
 * stored in S3 while New Hire employee data will be stored in a DynamoDB instance.
 */
function getPersistenceAdapter(tableName) {
    if (USE_DYNAMO === true) {
        // TODO: dynamodb will be connected to and have a connector instantiated here.
        // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({
            tableName: tableName || 'Session',
            createTable: true
        });
    }
};

/**
 * LaunchRequestHandler is invoked as soon as the Alexa skill starts up.
 */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const sessionCounter = sessionAttributes['sessionCounter'];
        const roleName = sessionAttributes['roleName'];

        console.log(sessionCounter);
        const speakOutput = !sessionCounter ? handlerInput.t('WELCOME_MSG') : handlerInput.t('WELCOME_BACK_MSG', {role: roleName});   // TODO: use userRole 
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler allows us to register the user's role as a current employee
 * or a new hire.
 */
const RegisterRoleIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegisterRoleIntent';
    },
    handle(handlerInput) {
        // access session attributes
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        
        let speakOutput = 'failed to confirm role!';
        if (intent.slots.role.confirmationStatus === 'CONFIRMED') {
            const roleObject = Alexa.getSlot(requestEnvelope, 'role');
            
            // save the slot object and also the role name (for convenience's sake)
            sessionAttributes['roleObject'] = roleObject;
            const roleName = roleObject.resolutions.resolutionsPerAuthority[0].values[0].value.name;
            sessionAttributes['roleName'] = roleName;
            speakOutput = handlerInput.t('CONFIRMED_ROLE_MSG', {role: roleName});
            
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

const RegisterNameIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegisterNameIntent';
    },
    handle(handlerInput) {
        // access session attributes
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        
        let speakOutput =  'failed to confirm name!';
        const name = Alexa.getSlotValue(requestEnvelope, 'name');
        sessionAttributes['name'] = name;
        speakOutput = handlerInput.t('CONFIRMED_NAME_MSG', {name:name});   
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

/**
 * As a new hire, ask for your start date.
 */
const SayStartDateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SayStartDateIntent';
    },
    handle(handlerInput) {
        // verify if user is a new hire
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        var speakOutput = handlerInput.t('START_DATE_ERROR_MSG')
        if (sessionAttributes['roleName'] === 'NewHire') {
            // var timezone = sessionAttributes['timezone'];
            let timezone = 'America/Los_Angeles'
            let promise = utility.getItem('NEW_HIRE',sessionAttributes['name'])
            return promise.then(data => {                
                let startDate = data.Item.START_DATE.S
                let startDateObject = new Date(startDate)
                const day = startDateObject.getDate() + 1;
                console.log(day)
                const month = startDateObject.getMonth() + 1;  // months are 0-11
                const year = startDateObject.getFullYear();
                const daysUntilStartDate = startDateLogic.getStartDateData(day, month, year, timezone).daysUntilStartDate;
                if (daysUntilStartDate === 0) {
                    speakOutput = 'Congratulations! Welcome, it\'s you\'re first day an Amazonian!'
                } else {
                    speakOutput = handlerInput.t('START_DATE_MSG',{date:startDate,num:daysUntilStartDate});
                }
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt()
                    .getResponse();
            }).catch(error => {
                console.log(error)
                // returns can not find start date or new hire msg
                speakOutput = 'Your date cannot be found';
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt()
                    .getResponse();
            });
        } else {
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
        }
    }
};

/**
 * As an Amazonian, register a new hire's information.
 */
const RegisterNewHireIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegisterNewHireIntent';
    },
    handle(handlerInput) {
        // verify if a user is a current employee
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        
        let speakOutput = handlerInput.t('REGISTER_NEW_HIRE_ERROR');
        if (sessionAttributes['roleName'] === 'Amazonian' 
            && intent.confirmationStatus === 'CONFIRMED') {
            // register a new hire's information
            if (!utility.doesTableExist("NEW_HIRE")) {
                utility.createNewHireTable();
            }
            const newHireName = Alexa.getSlotValue(requestEnvelope, 'name');
            const newHireStartDate = Alexa.getSlotValue(requestEnvelope, 'start_date'); // format is YYYY-MM-DD
            const managerName = Alexa.getSlotValue(requestEnvelope, 'manager_name');
            const teamName = Alexa.getSlotValue(requestEnvelope, 'team_name');
            utility.putItem('NEW_HIRE',newHireName,newHireStartDate,managerName,teamName)
            speakOutput = handlerInput.t(`REGISTER_NEW_HIRE_SUCCESS`, {name: newHireName, startDate: newHireStartDate, m_name: managerName, t_name: teamName});
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

/**
 * As an Amazonian invite another coworker into your current call/meeting.
 */
const InviteToMeetingIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'InviteToMeetingIntent';
    },
    handle(handlerInput) {
        // verify if a user is a current employee
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;
        
        let speakOutput = handlerInput.t('INVITE_ERROR_MSG');
        if (sessionAttributes['roleName'] === 'Amazonian' 
            && intent.slots.name.confirmationStatus === 'CONFIRMED') {
            // call another employee into the meeting or ping him/her thru Chime
            const coworkerName = Alexa.getSlotValue(requestEnvelope, 'name');
                
            // REPLACE THIS: inviteToMeeting(coworkerName);
            
            speakOutput = handlerInput.t('INVITE_SUCCESS_MSG', {name: coworkerName});
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

const RemindStartDateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RemindStartDateIntent';
    },
    async handle(handlerInput) {
        const {attributesManager, serviceClientFactory, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const {intent} = requestEnvelope.request;

        const startDate = sessionAttributes['startDate'];
        const name = sessionAttributes['name'] || '';
        let timezone = sessionAttributes['timezone'];
        const message = Alexa.getSlotValue(requestEnvelope, 'message');

        if (intent.confirmationStatus !== 'CONFIRMED') {
            return handlerInput.responseBuilder
                .speak(handlerInput.t('CANCEL_MSG') + handlerInput.t('REPROMPT_MSG'))
                .reprompt(handlerInput.t('REPROMPT_MSG'))
                .getResponse();
        }

        let speechText = '';
        const dateAvailable = day && month && year;
        if (dateAvailable){
            if (!timezone){
                //timezone = 'Europe/Rome';  // so it works on the simulator, you should uncomment this line, replace with your time zone and comment sentence below
                return handlerInput.responseBuilder
                    .speak(handlerInput.t('NO_TIMEZONE_MSG'))
                    .getResponse();
            }

            const startDateData = startDateLogic.getStartDateData(day, month, year, timezone);

            // let's create a reminder via the Reminders API
            // don't forget to enable this permission in your skill configuratiuon (Build tab -> Permissions)
            // or you'll get a SessionEnndedRequest with an ERROR of type INVALID_RESPONSE
            try {
                const {permissions} = requestEnvelope.context.System.user;
                if (!(permissions && permissions.consentToken))
                    throw { statusCode: 401, message: 'No permissions available' }; // there are zero permissions, no point in intializing the API
                const reminderServiceClient = serviceClientFactory.getReminderManagementServiceClient();
                // reminders are retained for 3 days after they 'remind' the customer before being deleted
                const remindersList = await reminderServiceClient.getReminders();
                console.log('Current reminders: ' + JSON.stringify(remindersList));
                // delete previous reminder if present
                const previousReminder = sessionAttributes['reminderId'];
                if (previousReminder){
                    try {
                        if (remindersList.totalCount !== "0") {
                            await reminderServiceClient.deleteReminder(previousReminder);
                            delete sessionAttributes['reminderId'];
                            console.log('Deleted previous reminder token: ' + previousReminder);
                        }
                    } catch (error) {
                        // fail silently as this means the reminder does not exist or there was a problem with deletion
                        // either way, we can move on and create the new reminder
                        console.log('Failed to delete reminder: ' + previousReminder + ' via ' + JSON.stringify(error));
                    }
                }
                // create reminder structure
                const reminder = startDateLogic.createStartDateReminder(
                    startDateData.daysUntilStartDate,
                    timezone,
                    Alexa.getLocale(requestEnvelope),
                    message);
                const reminderResponse = await reminderServiceClient.createReminder(reminder); // the response will include an "alertToken" which you can use to refer to this reminder
                // save reminder id in session attributes
                sessionAttributes['reminderId'] = reminderResponse.alertToken;
                console.log('Reminder created with token: ' + reminderResponse.alertToken);
                speechText = handlerInput.t('REMINDER_CREATED_MSG', {name: name});
                speechText += handlerInput.t('POST_REMINDER_HELP_MSG');
            } catch (error) {
                console.log(JSON.stringify(error));
                switch (error.statusCode) {
                    case 401: // the user has to enable the permissions for reminders, let's attach a permissions card to the response
                        handlerInput.responseBuilder.withAskForPermissionsConsentCard(constants.REMINDERS_PERMISSION);
                        speechText = handlerInput.t('MISSING_PERMISSION_MSG');
                        break;
                    case 403: // devices such as the simulator do not support reminder management
                        speechText = handlerInput.t('UNSUPPORTED_DEVICE_MSG');
                        break;
                    //case 405: METHOD_NOT_ALLOWED, please contact the Alexa team
                    default:
                        speechText = handlerInput.t('REMINDER_ERROR_MSG');
                }
                speechText += handlerInput.t('REPROMPT_MSG');
            }
        } else {
            speechText += handlerInput.t('MISSING_MSG');
            // we use intent chaining to trigger the birthday registration multi-turn
            handlerInput.responseBuilder.addDelegateDirective({
                name: 'RegisterNewHireIntent',
                confirmationStatus: 'NONE',
                slots: {}
            });
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(handlerInput.t('REPROMPT_MSG'))
            .getResponse();
    }
};

const GetManagerNameIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetManagerNameIntent';
    },
    handle(handlerInput){
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();

        let speakOutput = handlerInput.t('MANAGER_NAME_ERROR_MSG')
        if (sessionAttributes['roleName'] === 'NewHire'){
            //DynamoDB Interface
            const ManagerName = "Mark"
            speakOutput = handlerInput.t('MANAGER_NAME_SUCCESS_MSG',{manager: ManagerName});
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
        

    }
}

const GetTeamNameIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetTeamNameIntent';
    },
    handle(handlerInput){
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();

        let speakOutput = handlerInput.t('TEAM_NAME_ERROR_MSG')
        if (sessionAttributes['roleName'] === 'NewHire'){
            //DynameDB Interface
            const TeamName = "Alexa Team"
            speakOutput = handlerInput.t('TEAM_NAME_SUCCESS_MSG',{team:TeamName});
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
}


const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

/**
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers
 * for your intents by defining them above, then also adding them to the request
 * handler chain below.
 */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below.
 */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Bind pre-set messages from messages.js to funciton t() for handlerInput object.
 */
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings
        }).then((t) => {
            handlerInput.t = (...args) => t(...args);
        });
    }
};

/**
 * Below we use async and await ( more info: javascript.info/async-await )
 * It's a way to wrap promises and waait for the result of an external async operation
 * Like getting and saving the persistent attributes
 */
const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        const {attributesManager, requestEnvelope} = handlerInput;
        if (Alexa.isNewSession(requestEnvelope)){ //is this a new session? this check is not enough if using auto-delegate (more on next module)
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            console.log('Loading from persistent storage: ' + JSON.stringify(persistentAttributes));
            
            //copy persistent attribute to session attributes
            attributesManager.setSessionAttributes(persistentAttributes); // ALL persistent attributtes are now session attributes
        }
    }
};

/**
 * If you disable the skill and reenable it the userId might change and you loose the persistent attributes saved below as userId is the primary key
 */
const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
        const {attributesManager, requestEnvelope} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
        
        if (shouldEndSession || Alexa.getRequestType(requestEnvelope) === 'SessionEndedRequest') { // skill was stopped or timed out
            // we increment a persistent session counter here
            sessionAttributes['sessionCounter'] = sessionAttributes['sessionCounter'] ? sessionAttributes['sessionCounter'] + 1 : 1;
            // sessionAttributes['sessionCounter'] = 0;
            
            // we make ALL session attributes persistent
            console.log('Saving to persistent storage:' + JSON.stringify(sessionAttributes));
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,           // built-in handler
        RegisterRoleIntentHandler,
        SayStartDateIntentHandler,
        RegisterNewHireIntentHandler,
        InviteToMeetingIntentHandler,
        RegisterNameIntentHandler,
        GetManagerNameIntentHandler,
        GetTeamNameIntentHandler,
        RemindStartDateIntentHandler,
        HelloWorldIntentHandler,        
        HelpIntentHandler,              // built-in handler
        CancelAndStopIntentHandler,     // built-in handler
        SessionEndedRequestHandler,     // built-in handler
        IntentReflectorHandler,         // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .addRequestInterceptors(
        LocalisationRequestInterceptor,    
        LoadAttributesRequestInterceptor
    )
    .addResponseInterceptors(
        SaveAttributesResponseInterceptor
    )
    .withPersistenceAdapter(persistenceAdapter)
    .lambda();