@REQ_ID:1070683

Feature: Library - Concepts - Activities - Activities - Extended Scope
    As a user, I want to manage every Activities in the Concepts Library

    Background: User must be logged in
        Given The user is logged in

    Scenario: [Create][Mandatory fields] User must not be able to save new activity without mandatory fields of 'Activity group', 'Activity subgroup', 'Activity name'
        And The '/library/activities/activities' page is opened
        When The Add activity button is clicked
        And Form save button is clicked
        Then The user is not able to save the acitivity
        And The validation message appears for activity group
        And The validation message appears for activity name
        When Select a value for Activity group field
        And Form save button is clicked
        Then The validation message appears for activity subgroup

    Scenario: [Create][Uniqueness check][Synonym] User must not be able to save new activity with already existing synonym
        And The '/library/activities/activities' page is opened
        When [API] Activity in status Draft exists
        And The Add activity button is clicked
        And The activity form is filled with only mandatory data
        And The user adds already existing synonym
        And Form save button is clicked
        Then The user is not able to save activity with already existing synonym and error message is displayed

    Scenario: [Create][Mandatory fields] System must ensure value of 'Sentence case name' is mandatory
        And The '/library/activities/activities' page is opened
        When The Add activity button is clicked
        When The user enters a value for Activity name
        And The user clear default value from Sentance case name
        Then The validation message appears for sentance case name

    Scenario: [Create][Mandatory fields] System must default value for 'Data collection' to be checked
        And The '/library/activities/activities' page is opened
        When The Add activity button is clicked
        Then The default value for Data collection must be checked

    Scenario: [Create][Sentence case name validation] System must default value for 'Sentence case name' to lower case value of 'Activity name'
        And The '/library/activities/activities' page is opened
        When The Add activity button is clicked
        And The user enters a value for Activity name
        Then The field for Sentence case name will be defaulted to the lower case value of the Activity name

    Scenario: [Create][Sentence case name validation] System must ensure value of 'Sentence case name' independent of case is identical to the value of 'Activity name'
        And The '/library/activities/activities' page is opened
        When The Add activity button is clicked
        And The user define a value for Sentence case name and it is not identical to the value of Activity name
        And Form save button is clicked
        Then The user is not able to save the acitivity
        And The validation message appears for sentance case name that it is not identical to name

    Scenario: [Actions][Edit][version 1.0] User must be able to edit and approve new version of activity
        And The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        And [API] Activity in status Draft exists
        And [API] Activity is approved
        And Activity is searched for and found
        When The 'New version' option is clicked from the three dot menu list
        Then The item has status 'Draft' and version '1.1'
        When The 'Edit' option is clicked from the three dot menu list
        And The activity edition form is filled with data
        And Form save button is clicked
        And Activity is searched for and found
        Then The item has status 'Draft' and version '1.2'
        When The 'Approve' option is clicked from the three dot menu list
        Then The item has status 'Final' and version '2.0'

    Scenario: [Create][Negative case][Draft group] User must not be able to create activity linked to Drafted group until it is approved
        And [API] Activity group in status Draft exists
        And [API] Activity group is approved
        And [API] Activity subgroup is created
        And [API] Activity subgroup is approved
        And [API] Activity group gets new version
        And User waits for 2 seconds
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        When The Add activity button is clicked
        When The activity form is filled in using group and subgroup created through API
        And Form save button is clicked
        Then Validation error for GroupingHierarchy is displayed

    Scenario: [Create][Negative case][Retired group] User must not be able to create activity linked to Retired group until it is approved
        And [API] Activity group in status Draft exists
        And [API] Activity group is approved
        And [API] Activity subgroup is created
        And [API] Activity subgroup is approved
        And [API] Activity group is inactivated
        And User waits for 2 seconds
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        When The Add activity button is clicked
        When The activity form is filled in using group and subgroup created through API
        And Form save button is clicked
        Then Validation error for GroupingHierarchy is displayed

    Scenario: [Create][Negative case][Draft subgroup] User must not be able to create activity linked to Draft subgroup until it is approved
        And [API] Activity group in status Draft exists
        And [API] Activity group is approved
        And [API] Activity subgroup is created
        And User waits for 2 seconds
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        When The Add activity button is clicked
        And Custom group name is typed and selected in activity form
        And Drafted subgroup is not available during activity creation

    Scenario: [Create][Negative case][Retired subgroup] User must not be able to create activity linked to Retired subgroup until it is approved
        And [API] Activity group in status Draft exists
        And [API] Activity group is approved
        And [API] Activity subgroup is created
        And [API] Activity subgroup is approved
        And [API] Activity subgroup is inactivated
        And User waits for 2 seconds
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        When The Add activity button is clicked
        When The activity form is filled in using group and subgroup created through API
        And Form save button is clicked
        Then Validation error for GroupingHierarchy is displayed

    Scenario: [Cancel][Creation] User must be able to Cancel creation of the activity
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        When The Add activity button is clicked
        And The activity form is filled with only mandatory data
        When Modal window form is closed by clicking cancel button
        And Action is confirmed by clicking continue
        Then The form is no longer available
        And Activity is searched for and not found

    Scenario: [Cancel][Edition] User must be able to Cancel edition of the activity
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        And [API] Activity in status Draft exists
        And Activity is searched for and found
        When The 'Edit' option is clicked from the three dot menu list
        When The activity edition form is filled with data
        And Modal window form is closed by clicking cancel button
        And Action is confirmed by clicking continue
        Then The form is no longer available
        And Activity is searched for and not found

    Scenario: [Actions][Availability][Draft item] User must only have access to aprove, edit, delete, history actions for Drafted version of the activity
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        And [API] Activity in status Draft exists
        And Activity is searched for and found
        And The item actions button is clicked
        Then Only actions that should be avaiable for the Draft item are displayed

    Scenario: [Actions][Availability][Final item] User must only have access to new version, inactivate, history actions for Final version of the activity
        Given The '/library/activities/activities' page is opened
        When [API] Activity in status Draft exists
        And [API] Activity is approved
        And Activity is searched for and found
        And The item actions button is clicked
        Then Only actions that should be avaiable for the Final item are displayed

    Scenario: [Actions][Availability][Retired item] User must only have access to reactivate, history actions for Retired version of the activity
        Given The '/library/activities/activities' page is opened
        And User sets status filter to 'all'
        When [API] Activity in status Draft exists
        And [API] Activity is approved
        And [API] Activity is inactivated
        And Activity is searched for and found
        And The item actions button is clicked
        Then Only actions that should be avaiable for the Retired item are displayed

    Scenario: [Table][Filtering][Status selection] User must be able to use status selection to find or hide draft activity
        Given The '/library/activities/activities' page is opened
        When [API] Activity in status Draft exists
        When User sets status filter to 'final'
        And Activity is searched for and not found
        When User sets status filter to 'draft'
        And Activity is searched for and found
        When User sets status filter to 'retired'
        And Activity is searched for and not found
        When User sets status filter to 'all'
        And Activity is searched for and found

    Scenario: [Table][Filtering][Status selection] User must be able to use status selection to find or hide approved activity
        Given The '/library/activities/activities' page is opened
        When [API] Activity in status Draft exists
        And [API] Activity is approved
        When User sets status filter to 'draft'
        And Activity is searched for and not found
        When User sets status filter to 'final'
        And Activity is searched for and found
        When User sets status filter to 'retired'
        And Activity is searched for and not found
        When User sets status filter to 'all'
        And Activity is searched for and found

    Scenario: [Table][Filtering][Status selection] User must be able to use status selection to find or hide retired activity
        Given The '/library/activities/activities' page is opened
        When [API] Activity in status Draft exists
        And [API] Activity is approved
        And [API] Activity is inactivated
        When User sets status filter to 'draft'
        And Activity is searched for and not found
        When User sets status filter to 'retired'
        And Activity is searched for and found
        When User sets status filter to 'final'
        And Activity is searched for and not found
        When User sets status filter to 'all'
        And Activity is searched for and found
    
    Scenario: [Table][Filtering][Status selection] User must be able to use status selection to find or hide new version of activity
        Given The '/library/activities/activities' page is opened
        When [API] Activity in status Draft exists
        And [API] Activity is approved
        And [API] Activity new version is created
        When User sets status filter to 'final'
        And Activity is searched for and not found
        When User sets status filter to 'draft'
        And Activity is searched for and found
        When User sets status filter to 'retired'
        And Activity is searched for and not found
        When User sets status filter to 'all'
        And Activity is searched for and found

    Scenario: [Table][Filtering][Status selection] User must be able to see that status filter is not available after expanding column based filters
        Given The '/library/activities/activities' page is opened
        Then The status filter is not available when expanding available filters
