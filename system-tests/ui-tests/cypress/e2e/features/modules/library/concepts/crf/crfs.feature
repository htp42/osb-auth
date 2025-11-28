@REQ_ID:1070683
Feature: Library - Concepts - CRFs from Veeva EDC

  As a user, I want to verify that the CRFs Library exported from Veeva EDC Libary are correctly displayed
  so that I can ensure the integrity and accuracy of the CRF data within the StudyBuilder CRF Library.

  Background: User must be logged in
    Given The user is logged in

  Scenario: [Navigation] User must be able to navigate to CRFs page
    Given The '/library' page is opened
    When The 'CRF builder' submenu is clicked in the 'Concepts' section
    Then The current URL is '/library/crfbuilder'

  @manual_test
  Scenario: CRFs must be exported from Veeva EDC to StudyBuilder CRF Library
    When I view the StudyBuilder CRF 'forms' library
    And The imported form 'Vital Sign' should be visible in the StudyBuilder CRF forms library

  @manual_test
  Scenario: CRFs must be exported from Veeva EDC to StudyBuilder CRF Library
    When I view the StudyBuilder CRF 'forms' library
    Then The number of 'forms' in the CRF library should match the number of '25' in Veeva EDC library

  @manual_test
  Scenario: CRFs must be exported from Veeva EDC to StudyBuilder CRF Library
    When I view the StudyBuilder CRF 'items' library
    Then The number of 'items' in the CRF library should match the number of '25' in Veeva EDC library

  @manual_test
  Scenario: CRFs must be exported from Veeva EDC to StudyBuilder CRF Library
    When I view the StudyBuilder CRF 'item-groups' library
    Then The number of 'item-groups' in the CRF library should match the number of '25' in Veeva EDC library

  @manual_test
  Scenario: Verify Properties of CRF Items between Veeva EDC and CRF Library
    When I view the StudyBuilder CRF 'items' library
    Then The imported item 'I.VSORRER_SYSBP_REPNUM1' in CRF Library should have the same values as item in Veeva EDC
  
  @manual_test
  Scenario: Verify Properties of CRF Item Groups between Veeva EDC and CRF Library
    When I view the StudyBuilder CRF 'item-groups' library
    Then The imported item group 'VS_2' in CRF Library should have the same values as item group in Veeva EDC
