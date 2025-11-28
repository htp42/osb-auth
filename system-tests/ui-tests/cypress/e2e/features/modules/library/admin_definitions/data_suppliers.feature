@REQ_ID:2383812
Feature: Library - Admin Definitions - Data Suppliers
    As a user, I want to manage the data suppliers in the Concepts Library UI

    Background:
        Given The user is logged in

    @smoke_test
    Scenario: [Navigation] User must be able to navigate to the Data Suppliers page
        Given The '/library' page is opened
        When The 'Data Suppliers' submenu is clicked in the 'Admin Definitions' section
        Then The current URL is '/library/data-suppliers'

    Scenario: [Table][Options] User must be able to see table with correct options
        Given The '/library/data-suppliers' page is opened
        Then A table is visible with following options
            | options                                                         |
            | Add Data Supplier                                               |
            | Filters                                                         |
            | Columns                                                         |
            | Export                                                          |
            | search-field                                                    |

    Scenario: [Table][Columns][Names] User must be able to see the columns list on the main page as below
        Given The '/library/data-suppliers' page is opened
        Then A table is visible with following headers
            | headers            |
            | Name               |
            | Description        |
            | Order              |
            | API base URL       |
            | UI base URL        |
            | Type               |
            | Origin Source      |
            | Origin Type        |
            | Modified           |
            | Change description |
            | Version            |
            | Status             |

@manual_test
    Scenario: Create a new data supplier
        Given The '/library/data_suppliers' page is opened  
        When The user clicks on the 'Add Data Supplier' button
        Then The create page will open
        When The user inputs name, description, and orders
        And Selects the value 'EDC system' from the Type option
        And Clicks the Save button
        Then A pop-up displays 'Data Supplier created successfully'
        And The created test supplier is found in the table with correct information
        And The version is 1.0 and the status is Final
        When The user clicks on the 'Add Data Supplier' button
        Then The create page will open
        When The user inputs name, description, and orders
        And Selects the value 'Lab data exchange files' from the Type option
        And Clicks the Save button
        Then A pop-up displays 'Data Supplier created successfully'
        And The created test supplier is found in the table with correct information
        And The version is 1.0 and the status is Final

@manual_test
    Scenario: Edit the created data supplier
        When The user clicks on the three-dot menu list for the selected test supplier and selects the Edit option
        Then The Edit page will open
        When The user updates the name, description, and orders
        And Change the value to 'eCOA data exchange files' from the Type option
        And Clicks the Save button
        Then A pop-up displays 'Data Supplier updated successfully'
        And The updated test supplier is found in the table with correct information
        And The version is 2.0 and the status is Final

@manual_test
    Scenario: Inactivate and reactivate a data supplier
        When The user clicks on the three-dot menu list for the selected test supplier and selects the Inactive option
        Then The status changes to Retired, and the version is 1.0
        When The user clicks on the three-dot menu list for the selected test supplier and selects the Reactive option
        Then The status changes to Final, and the version is 1.0
        
@manual_test
    Scenario: Check history of a data supplier
        When The user clicks on the three-dot menu list for the selected test supplier and selects the History option
        Then The history page can be open successfully
        When The user clicks on the Close button
        Then The history page will close
        # Note: Do not need to verify the history details, as API tests already cover this part