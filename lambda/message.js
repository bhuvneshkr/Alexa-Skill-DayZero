// message.js
// ==========

module.exports = {
    en: {
        translation: {
            WELCOME_MSG: `Welcome to Day Zero! Are you starting as a New Hire soon or are you a Current Amazonian?`,
            WELCOME_BACK_MSG: 'Welcome back to Day Zero, fellow {{role}}!',
            ROLE_REJECTED_MSG: 'No problem. Please say new hire or amazonian again so I can get it right.',
            CONFIRMED_ROLE_MSG: 'Confirmed your role as {{role}}!',
            START_DATE_ERROR_MSG: 'You have already started at Amazon, silly!',
            REGISTER_NEW_HIRE_ERROR: 'It sounded like you were trying to register a new hire. Sorry, but you do not have permission for this.',
            REGISTER_NEW_HIRE_SUCCESS: 'Alright, I have successfully registered {{name}} to start on {{startDate}}!',
            MISSING_ROLE_MSG: `It looks like you haven't told me if your role yet. Are you a New Hire or Current Employee? `,
            HELP_MSG: 'I can remember your role if you tell me you are a new hire or Amazonian. Depending on your role I can help you with a few more things. Would you like to tell me your role? ',
            REPROMPT_MSG: `If you're not sure what to do next try asking for help. If you want to leave just say stop. What would you like to do next? `,
            GOODBYE_MSG: 'Goodbye!',
            REFLECTOR_MSG: 'You just triggered {{intent}}',
            FALLBACK_MSG: 'Sorry, I don\'t know about that. Please try again.',
            ERROR_MSG: 'Sorry, there was an error. Please try again.'
        }
    }
}
