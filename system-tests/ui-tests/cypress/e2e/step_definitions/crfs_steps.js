const { Given, When, Then } = require("@badeball/cypress-cucumber-preprocessor");


Given('I view the StudyBuilder CRF {string} library', (itemType) => {
    cy.visit(`library/crfbuilder/${itemType}`)
    cy.waitForPage()
})

Then('The imported form {string} should be visible in the StudyBuilder CRF forms library', (formName) => {
    cy.request('api/concepts/odms/forms?page_number=1&page_size=100&total_count=true').then((req) => {
        let formName = req.body.items.find(form => form.name == formName)
        expect(formName.name).to.contain(formName)
    })
})

Then('The number of {string} in the CRF library should match the number of {string} in Veeva EDC library', (itemType, number) => {
    cy.request(`/api/concepts/odms/${itemType}?page_number=1&page_size=100&total_count=true`).then((req) => {
        expect(req.body.total).to.eq(parseInt(number))
    })
})

Then('The imported item {string} in CRF Library should have the same values as item in Veeva EDC', (itemOid) => {
    cy.request('/api/concepts/odms/items?page_number=1&page_size=100&total_count=true').then((req) => {
        let data = req.body.items.find(item => item.oid == itemOid)
        expect(data.oid).to.eq(itemOid)
        expect(data.length).to.eq(3)
        expect(data.significant_digits).to.eq(3)
        expect(data.datatype).to.eq('INTEGER')
        expect(data.name).to.eq('Systolic blood pressure')
        expect(data.unit_definitions[0].name).to.eq('mmHg')
        expect(data.unit_definitions[0].mandatory).to.eq(true)

    })

})

Then('The imported item group {string} in CRF Library should have the same values as item group in Veeva EDC', (itemGroupOid) => {
    cy.request('/api/concepts/odms/items?page_number=1&page_size=100&total_count=true').then((req) => {
        let data = req.body.items.find(item_group => item_group.oid == itemGroupOid)
        expect(data.oid).to.eq(itemGroupOid)
        expect(data.length).to.eq(3)
        expect(data.datatype).to.eq('INTEGER')
        expect(data.name).to.eq('Blood pressure and pulse - Second last measurement')
        expect(data.repeating).to.eq('No')

    })

})
