// message.js
// ==========

module.exports = {
    en: {
        translation: {
            WELCOME_MSG: `Welcome to Day Zero! Are you starting as a New Hire soon or are you a Current Amazonian?`,
            WELCOME_BACK_MSG: 'Welcome back to Day Zero, fellow {{role}}!',
            ROLE_REJECTED_MSG: 'No problem. Please say new hire or amazonian again so I can get it right.',
            CONFIRMED_ROLE_MSG: 'Confirmed your role as {{role}}! \n What\'s your name?',
            CONFIRMED_NAME_MSG: 'Hello {{name}}!',
            START_DATE_MSG: 'Your start date is {{date}} and there is {{num}} days left.',
            START_DATE_ERROR_MSG: 'You have already started at Amazon, silly!',
            REGISTER_NEW_HIRE_ERROR: 'It sounded like you were trying to register a new hire. Sorry, but you do not have permission for this.',
            REGISTER_NEW_HIRE_SUCCESS: 'Alright, I have successfully registered {{name}} to start working at {{t_name}} and report to {{m_name}} starting on {{startDate}}!',
            MISSING_ROLE_MSG: `It looks like you haven't told me if your role yet. Are you a New Hire or Current Employee? `,
            INVITE_ERROR_MSG: 'Sorry, I cannot invite that person for you. Please remember only current Amazonians may do this.',
            INVITE_SUCCESS_MSG: 'Alright! I will let {{name}} know about this meeting right away!',
            HELP_MSG: 'I can remember your role if you tell me you are a new hire or Amazonian. Depending on your role I can help you with a few more things. Would you like to tell me your role? ',
            REPROMPT_MSG: `If you're not sure what to do next try asking for help. If you want to leave just say stop. What would you like to do next? `,
            GOODBYE_MSG: 'Goodbye!',
            REFLECTOR_MSG: 'You just triggered {{intent}}',
            FALLBACK_MSG: 'Sorry, I don\'t know about that. Please try again.',
            ERROR_MSG: 'Sorry, there was an error. Please try again.',
            MANAGER_NAME_ERROR_MSG: 'Sorry, there was an error in getting your managers name',
            MANAGER_NAME_SUCCESS_MSG: 'Your managers name is {{ManagerName}}',
            TEAM_NAME_ERROR_MSG: 'Sorry, there was an error in getting your teams name ',
            TEAM_NAME_SUCCESS_MSG: 'Your teams name is {{TeamName}}'
        }
    }
}