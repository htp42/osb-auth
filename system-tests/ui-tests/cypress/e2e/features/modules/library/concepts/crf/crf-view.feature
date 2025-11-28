@REQ_ID:1070683
Feature: Library - Concepts - CRF viewer - CRF View

 As a user, I want to verify that the CRFs View page exported from Veeva EDC Libary are correctly displayed. 

  Background: User must be logged in
    Given The user is logged in
    And The '/library' page is opened

  @smoke_test
  Scenario: [Navigation] User must be able to navigate to CRF View page
    Given The '/library' page is opened
    When The 'CRF viewer' submenu is clicked in the 'Concepts' section
    And The 'CRF Viewer' tab is selected
    Then CRF 'CRF Viewer' page is loaded

@manual_test
  Scenario: Verifying Falcon download functionality works as expected in the Stylesheet dropdown menu
    Given The '/library/crfviewer/odm-viewer' page is opened
    When I select a value from the ODM Element Name dropdown
    And I select 'Downloadable Falcon (Word)' in the Stylesheet dropdown list
    And I click the LOAD button
    Then The imported CRF view page should be displayed
    When I click the 'Export data in HTML format' option
    Then The file should be downloaded successfully on the local machine
    When I open the downloaded file in Word format
    And Compare the downloaded file with the CRF view page
    Then The content and the format in both places should look exactly the same