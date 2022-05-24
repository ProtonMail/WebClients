c('Action').t('Salut')
c('Action').c('Robert')
c('Action').c('jeanne')
c('Action').t('Monique')
c('Action').`OUPS`
c('Action').`OUPS 2`
c('Action').c`Nope monique`
c('Action').c`Nope monique 2`
c('Action').ngettext(msgid`Day`, 'Days', modifiedValue)
c('Action').ngettext(msgid`Miinute`, "Miinutes", modifiedValue)
c('Action').ngettext(msgid('Miinute'), "Miinutes", modifiedValue)

mailpro2022: {
    label: c('new_plans_mailpro2022_team_management_session_management_label')
        .t`User session management`,
    tooltip: c(
      `new_plans_mailpro2022_team_management_session_management_tooltip`
    ).t`Force sign-out of user sessions when user credentials are believed to be compromised.`,
    icon: <DynamicHeroIcon className="w-5 h-5" icon="CheckIcon" />,
},
