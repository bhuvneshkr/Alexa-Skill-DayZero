// index.js
// ========

const Alexa = require('ask-sdk-core');
const languageStrings = require('./message.js');
const i18n = require('i18next');

console.log('getting persistenceAdaper');
let USE_DYNAMO = false;     // ENABLE THIS TO INSTANTIATE DYNAMODB
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
            // tableName: tableName || 'newHires',
            createTable: true
        });
    }
    
    // connect to S3 to store user role (New Hire or Current Amazonian)
    const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
    return new S3PersistenceAdapter({
        bucketName: process.env.S3_PERSISTENCE_BUCKET
    });
}

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
        
        let speakOutput = handlerInput.t('START_DATE_ERROR_MSG');
        if (sessionAttributes['roleName'] === 'NewHire') {
            // REPLACE THIS: speakOutput = getNewHireStartDate()
            
            // placeholder
            speakOutput = 'I will tell you your start date when the feature is complete!';
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
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
            const newHireName = Alexa.getSlotValue(requestEnvelope, 'name');
            const newHireStartDate = Alexa.getSlotValue(requestEnvelope, 'start_date'); // format is YYYY-MM-DD
            
            // REPLACE THIS: registerNewHire(newHireName, newHireStartDate);
            
            speakOutput = handlerInput.t(`REGISTER_NEW_HIRE_SUCCESS`, {name: newHireName, startDate: newHireStartDate});
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
